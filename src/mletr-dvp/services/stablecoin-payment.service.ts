import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers, Wallet } from 'ethers-v5';
import { CHAIN_ID, SUPPORTED_CHAINS } from '@trustvc/trustvc';
import { StablecoinType } from '../types/dvp-settlement.types';

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];

export interface PaymentVerificationResult {
  verified: boolean;
  amountReceived: string;
  amountReceivedAtomic: string;
  fromAddress: string;
  toAddress: string;
  blockNumber: number;
  message: string;
}

@Injectable()
export class StablecoinPaymentService {
  private readonly logger = new Logger(StablecoinPaymentService.name);

  constructor(private readonly configService: ConfigService) {}

  getEscrowWalletAddress(): string {
    return (
      this.configService.get<string>('DVP_ESCROW_WALLET_ADDRESS') ??
      this.configService.get<string>('ISSUER_WALLET') ??
      ''
    );
  }

  getTokenContractAddress(stablecoin: StablecoinType): string {
    const key = `STABLECOIN_${stablecoin}_CONTRACT_ADDRESS`;
    return this.configService.get<string>(key) ?? '';
  }

  getTokenDecimals(stablecoin: StablecoinType): number {
    const configured = this.configService.get<number>(`STABLECOIN_${stablecoin}_DECIMALS`);
    return configured ?? (stablecoin === StablecoinType.USDC ? 6 : 18);
  }

  parseAmountToAtomic(amount: string, decimals: number): string {
    return ethers.utils.parseUnits(amount, decimals).toString();
  }

  formatAtomicToHuman(amountAtomic: string, decimals: number): string {
    return ethers.utils.formatUnits(amountAtomic, decimals);
  }

  private getProvider(): ethers.providers.JsonRpcProvider {
    const chainId =
      (this.configService.get<string>('CHAIN_ID') as CHAIN_ID) ?? CHAIN_ID.amoy;
    const chainInfo = SUPPORTED_CHAINS[chainId];
    const JsonRpcProvider = ethers.version.startsWith('6.')
      ? (ethers as any).JsonRpcProvider
      : (ethers as any).providers.JsonRpcProvider;
    return new JsonRpcProvider(chainInfo.rpcUrl);
  }

  private getTokenContract(
    tokenAddress: string,
    signerOrProvider?: ethers.Signer | ethers.providers.Provider,
  ): ethers.Contract {
    const provider = signerOrProvider ?? this.getProvider();
    return new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  }

  async verifyPaymentToEscrow(
    paymentTxHash: string,
    expectedAmountAtomic: string,
    tokenContractAddress: string,
    escrowAddress: string,
  ): Promise<PaymentVerificationResult> {
    try {
      const provider = this.getProvider();
      const receipt = await provider.getTransactionReceipt(paymentTxHash);

      if (!receipt || receipt.status !== 1) {
        return {
          verified: false,
          amountReceived: '0',
          amountReceivedAtomic: '0',
          fromAddress: '',
          toAddress: '',
          blockNumber: 0,
          message: 'Transaction not found or failed',
        };
      }

      const tokenContract = this.getTokenContract(tokenContractAddress, provider);
      const transferFilter = tokenContract.filters.Transfer(null, escrowAddress.toLowerCase());
      const iface = new ethers.utils.Interface(ERC20_ABI);

      let totalReceived = ethers.BigNumber.from(0);
      let fromAddress = '';

      for (const log of receipt.logs) {
        if (log.address.toLowerCase() !== tokenContractAddress.toLowerCase()) {
          continue;
        }
        try {
          const parsed = iface.parseLog(log);
          if (parsed.name === 'Transfer') {
            const to = parsed.args.to as string;
            if (to.toLowerCase() === escrowAddress.toLowerCase()) {
              totalReceived = totalReceived.add(parsed.args.value);
              fromAddress = parsed.args.from as string;
            }
          }
        } catch {
          // Not a Transfer event from our token
        }
      }

      const expected = ethers.BigNumber.from(expectedAmountAtomic);
      const verified = totalReceived.gte(expected);

      return {
        verified,
        amountReceivedAtomic: totalReceived.toString(),
        amountReceived: ethers.utils.formatUnits(totalReceived, await tokenContract.decimals()),
        fromAddress,
        toAddress: escrowAddress,
        blockNumber: receipt.blockNumber,
        message: verified
          ? 'Payment verified in escrow'
          : `Insufficient payment: received ${totalReceived.toString()}, expected ${expectedAmountAtomic}`,
      };
    } catch (error) {
      this.logger.error({ message: 'Payment verification failed', error: error.message });
      return {
        verified: false,
        amountReceived: '0',
        amountReceivedAtomic: '0',
        fromAddress: '',
        toAddress: '',
        blockNumber: 0,
        message: `Verification error: ${error.message}`,
      };
    }
  }

  async releasePaymentToSeller(
    tokenContractAddress: string,
    sellerAddress: string,
    amountAtomic: string,
  ): Promise<{ txHash: string }> {
    const privateKey = this.configService.get<string>('DVP_ESCROW_WALLET_KEY');
    if (!privateKey) {
      throw new Error('DVP_ESCROW_WALLET_KEY is not configured');
    }

    const provider = this.getProvider();
    const wallet = new Wallet(privateKey, provider);
    const tokenContract = this.getTokenContract(tokenContractAddress, wallet);

    const tx = await tokenContract.transfer(sellerAddress, amountAtomic);
    const receipt = await tx.wait();

    this.logger.log({
      message: 'Stablecoin payment released to seller',
      txHash: receipt.transactionHash,
      sellerAddress,
      amountAtomic,
    });

    return { txHash: receipt.transactionHash };
  }

  async getEscrowBalance(tokenContractAddress: string): Promise<string> {
    const escrowAddress = this.getEscrowWalletAddress();
    if (!escrowAddress || !tokenContractAddress) {
      return '0';
    }
    const tokenContract = this.getTokenContract(tokenContractAddress);
    const balance = await tokenContract.balanceOf(escrowAddress);
    const decimals = await tokenContract.decimals();
    return ethers.utils.formatUnits(balance, decimals);
  }
}
