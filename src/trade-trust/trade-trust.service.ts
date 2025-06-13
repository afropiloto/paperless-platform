import { Injectable, Logger } from '@nestjs/common';
import {
  TradeTrustDocumentClass, TradeTrustFileDetails,
  WrappedDocumentDetails,
} from './trade-trust.types';
import {
  v5Contracts,
  wrapOADocument,
  SUPPORTED_CHAINS,
  CHAIN_ID,
  signOA
} from '@trustvc/trustvc';
import { ethers, Wallet } from 'ethers-v5';
import { ConfigService } from '@nestjs/config';
import {
  BillOfExchangeContentDto, InvoiceContentDto,
  OtherDocumentContentDto,
  PromissoryNoteContentDto,
} from '../trade-documents/dtos/trade-document.dto';

const documentBase: { $template: { name: string; type: string; url: string } } = {
  $template: {
    name: "CUSTOM_TEMPLATE",
    type: "EMBEDDED_RENDERER",
    url: "https://localhost:3000/renderer",
  },
};


@Injectable()
export class TradeTrustService {
  private readonly logger = new Logger(TradeTrustService.name);

  constructor(private readonly configService: ConfigService){}


  async mintTransferableDocument(tokenId: string, beneficiaryAddress:string, holderAddress:string){
    const chainId: CHAIN_ID = this.configService.get<string>('CHAIN_ID') as CHAIN_ID ?? CHAIN_ID.stabilitytestnet;
    const chainInfo = SUPPORTED_CHAINS[chainId];
    const tokenRegistryAddress = this.configService.get<string>('TOKEN_REGISTRY_ADDRESS')
    const { TradeTrustToken__factory } = v5Contracts;

    const JsonRpcProvider = ethers.version.startsWith("6.")
      ? (ethers as any).JsonRpcProvider
      : (ethers as any).providers.JsonRpcProvider;

    const provider = new JsonRpcProvider(chainInfo.rpcUrl);
    const unconnectedWallet = new Wallet(this.configService.get<string>('ISSUER_WALLET_KEY'));
    const wallet = unconnectedWallet.connect(provider);
    const tokenRegistry = new ethers.Contract(
      this.configService.get<string>('TOKEN_REGISTRY_ADDRESS'),
      TradeTrustToken__factory.abi,
      wallet
    );

    let tx;
    if (chainInfo.gasStation) {
      const gasFees = await chainInfo.gasStation();
      console.log('gasFees', gasFees);
      tx = await tokenRegistry.mint(beneficiaryAddress, holderAddress, tokenId, "0x", {
        maxFeePerGas: gasFees!.maxFeePerGas?.toBigInt() ?? 0,
        maxPriorityFeePerGas: gasFees!.maxPriorityFeePerGas?.toBigInt() ?? 0,
      });
    } else {
      tx = await tokenRegistry.mint(beneficiaryAddress, holderAddress, tokenId, "0x");
    }
    const receipt = await tx.wait();

    return {receipt: receipt.transactionHash, chainId: chainId, contractAddress: tokenRegistryAddress}
  }


  async signVerifiableDocument(wrappedContent: string) {
    const signerWallet = new Wallet(this.configService.get<string>('ISSUER_WALLET_KEY'));

      const wrappedOAContent = JSON.parse(wrappedContent)
      const signedDocument = await signOA(wrappedOAContent,
        signerWallet
      );
      this.logger.debug({signedDocument})
      return JSON.stringify(signedDocument);
  }

  async wrapDocument(tradeTrustDocumentType: TradeTrustDocumentClass,
                     attachments: TradeTrustFileDetails[],
                     documentContent:
                       | InvoiceContentDto
                       | BillOfExchangeContentDto
                       | PromissoryNoteContentDto
                       | OtherDocumentContentDto): Promise<WrappedDocumentDetails> {

    // Handle Attachments
    const validAttachments = [];

    attachments.forEach((item) => {
      if (
        item.fileName !== undefined &&
        item.dataUrl !== undefined &&
        item.mimeType !== undefined
      ) {
        validAttachments.push({
          filename: item.fileName,
          type: item.mimeType,
          data: item.dataUrl,
        });
      }
    });

    // Construct Document
    const chainId: CHAIN_ID = process.env.CHAIN_ID as CHAIN_ID ?? CHAIN_ID.amoy;
    const chainInfo = SUPPORTED_CHAINS[chainId];

    const document = this.baseDocumentFactory(tradeTrustDocumentType, chainInfo.name, chainInfo.id)
    if (validAttachments.length > 0) {
      document["attachments"] = validAttachments;
    }
    const docToWrap = JSON.parse(JSON.stringify({ ...document, ...documentContent }));
    this.logger.debug({docToWrap})
    try {
      const wrappedDocument = await wrapOADocument(docToWrap);
      const merkleRoot = `0x${wrappedDocument.signature.targetHash}`
      if (tradeTrustDocumentType === TradeTrustDocumentClass.VERIFIABLE) {
        // Sign verifiable document
        const wallet = new Wallet(this.configService.get<string>('ISSUER_WALLET_KEY'));
        return {
          merkleRoot,
          wrappedContent: JSON.stringify(await signOA(wrappedDocument, wallet))
        } as WrappedDocumentDetails
      }
      // Document is verifiable
      return {
        merkleRoot,
        wrappedContent: JSON.stringify(wrappedDocument),
      } as WrappedDocumentDetails;
    }
     catch(err) {
        this.logger.error({message:`Failed to wrap content as OA Document. Error: ${err.message}`});
        return {merkleRoot: "", wrappedContent: ""} as WrappedDocumentDetails
      }
  }

  private baseDocumentFactory (baseType:TradeTrustDocumentClass, chainName:string, chainId: string ) {
    const baseDoc = documentBase;

    if (baseType === TradeTrustDocumentClass.VERIFIABLE) {
      baseDoc["issuers"] = [
        {
          id: `did:ethr:${this.configService.get<string>('ISSUER_WALLET')}`,
          name: this.configService.get<string>('ISSUER_NAME'),
          identityProof: {
            type: "DNS-DID",
            location: this.configService.get<string>('APP_DOMAIN'),
            key: `did:ethr:${this.configService.get<string>('ISSUER_WALLET')}#controller`
          },
          revocation: {
            type: "NONE"
          },
        }];
    }
    if (baseType === TradeTrustDocumentClass.TRANSFERABLE) {
      baseDoc["issuers"] = [
        {
          name: "VOY TOKEN REGISTRY",
          tokenRegistry: this.configService.get<string>('TOKEN_REGISTRY_ADDRESS'),
          identityProof: {
            type: "DNS-TXT",
            location: this.configService.get<string>('APP_DOMAIN'),
          },
          revocation: {
            type: "NONE"
          }
        }];

    }
    baseDoc["network"] = {
      chain: chainName,
      chainId: chainId
    }
    return baseDoc as any;
  }




}