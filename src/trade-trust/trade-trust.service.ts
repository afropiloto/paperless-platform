import { Injectable, Logger } from '@nestjs/common';
import {
  TradeTrustDocumentClass, TradeTrustFileDetails,
  WrappedDocumentDetails,
} from './trade-trust.types';
import {
  BillOfExchangeContent,
  InvoiceContent, OtherDocumentContent, PromissoryNoteContent,
  TradeDocumentFileDetails, TradeDocumentType,
} from '../types/trade-documents.types';
import { v5Contracts, wrapOADocument } from '@trustvc/trustvc';
import { JsonRpcProvider, Wallet } from 'ethers-v6';
import { ethers as ethersV5, Wallet as WalletV5 } from 'ethers-v5';
import { getGasFees } from '../utils/web3-utils';
import { LookupService } from '../lookup/lookup.service';
import { ConfigService } from '@nestjs/config';
import { DocumentStoreFactory } from '@tradetrust-tt/document-store';

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

  constructor(private readonly configService: ConfigService,
              private readonly lookupService: LookupService){}


  private async getIssuingWalletV6() {
    const chainInformation = await this.lookupService.getChainDetailsByChainId(this.configService.get<string>('CHAIN_ID'))
    const issuerPrivateKey = this.configService.get<string>('VOY_WALLET_KEY')
    const unconnectedWallet = new Wallet(issuerPrivateKey);

    const provider = new JsonRpcProvider(chainInformation.rpcUrl);
    return unconnectedWallet.connect(provider);
  }
  private async getIssuingWalletV5() {
    const chainInformation = await this.lookupService.getChainDetailsByChainId(this.configService.get<string>('CHAIN_ID'))
    const issuerPrivateKey = this.configService.get<string>('VOY_WALLET_KEY')
    const unconnectedWallet = new WalletV5(issuerPrivateKey);

    const provider = new ethersV5.providers.JsonRpcProvider(chainInformation.rpcUrl);
    return unconnectedWallet.connect(provider);
  }

  getDocumentContentField(documentType: string) {
    switch (documentType.toLowerCase()) {
      case TradeDocumentType.INVOICE.toLowerCase():
        return "invoiceContent";
      case TradeDocumentType.BILL_OF_EXCHANGE.toLowerCase():
        return "billOfExchangeContent";
      case TradeDocumentType.PROMISSORY_NOTE.toLowerCase():
        return "promissoryNoteContent"
      case TradeDocumentType.OTHER.toLowerCase():
        return "otherTradeDocumentContent"
      default:
        return "otherTradeDocumentContent";
    }

  }


  async mintTransferableDocument(tokenId: string, beneficiaryAddress:string, holderAddress:string){
    const chainInformation = await this.lookupService.getChainDetailsByChainId(this.configService.get<string>('CHAIN_ID'))
    const tokenRegistryAddress = this.configService.get<string>('TOKEN_REGISTRY_ADDRESS')
    const { TradeTrustToken__factory } = v5Contracts;

    const wallet = await this.getIssuingWalletV6();

    const connectedRegistry = TradeTrustToken__factory.connect(tokenRegistryAddress, wallet);

    const suggestedGasPrice = { ...(await getGasFees(chainInformation.gasStation)), maxPriorityFeePerGas: 0, maxFeePerGas: 0};
    const receipt = await connectedRegistry.mint(beneficiaryAddress, holderAddress, tokenId, "0x", { ...suggestedGasPrice });
    await receipt.wait();

    return {receipt: receipt.transactionHash, chainId: parseInt(chainInformation.chainId), contractAddress: tokenRegistryAddress}
  }


  async issueVerifiableDocument(tokenId: string) {
    const chainInformation = await this.lookupService.getChainDetailsByChainId(this.configService.get<string>('CHAIN_ID'))
    const documentStoreAddress = this.configService.get<string>('DOCUMENT_STORE_ADDRESS')
    const wallet = await this.getIssuingWalletV5();

    const documentStore = DocumentStoreFactory.connect(documentStoreAddress, wallet);

    const suggestedGasPrice = { ...(await getGasFees(chainInformation.gasStation)), maxPriorityFeePerGas: 0, maxFeePerGas: 0};
    const tx = await  documentStore.issue(tokenId as any, {...suggestedGasPrice,});
    const receipt =  await tx.wait();
    const isIssued = await documentStore.isIssued(tokenId);
    return {receipt: receipt.transactionHash, isIssued, chainId: parseInt(chainInformation.chainId), contractAddress: documentStoreAddress};
  }

  async wrapDocument(tradeTrustDocumentType: TradeTrustDocumentClass,
                     attachments: TradeTrustFileDetails[],
                     documentContent:
                       | InvoiceContent
                       | BillOfExchangeContent
                       | PromissoryNoteContent
                       | OtherDocumentContent): Promise<WrappedDocumentDetails> {

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
    const chainDetails = await this.lookupService.getChainDetailsByChainId(this.configService.get<string>('CHAIN_ID'))
    const document = this.baseDocumentFactory(tradeTrustDocumentType, chainDetails.chainName, chainDetails.chainId)
    if (validAttachments.length > 0) {
      document["attachments"] = validAttachments;
    }
    const docToWrap = JSON.parse(JSON.stringify({ ...document, ...documentContent }));

    return wrapOADocument(docToWrap)
      .then(async (wrappedDocument) => {
        return {
          merkleRoot:`0x${wrappedDocument.signature.targetHash}`,
          wrappedContent: JSON.stringify(wrappedDocument),
        } as WrappedDocumentDetails;
      })
      .catch((err) => {
        this.logger.error({message:`Failed to wrap content as OA Document. Error: ${err.message}`});
        return {merkleRoot: "", wrappedContent: ""} as WrappedDocumentDetails
      })
  }

  private baseDocumentFactory (baseType:TradeTrustDocumentClass, chainName:string, chainId: string ) {
    const baseDoc = documentBase;

    if (baseType === TradeTrustDocumentClass.VERIFIABLE) {
      baseDoc["issuers"] = [
        {
          name: "VOY DOCUMENT STORE",
          documentStore: this.configService.get<string>('DOCUMENT_STORE_ADDRESS'),
          identityProof: {
            type: "DNS-TXT",
            location: "voy.finance",
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
            location: "voy.finance",
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