import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { TradeDocumentsRepository } from '../src/trade-documents/trade-documents.repository';
import { DvpSettlementRepository } from '../src/mletr-dvp/dvp-settlement.repository';
import { AccountsService } from '../src/accounts/accounts.service';
import { TradeDocumentStatus, TradeDocumentType } from '../src/types/trade-documents.types';
import { DvpSettlementStatus, StablecoinType } from '../src/mletr-dvp/types/dvp-settlement.types';
import { TradeTrustDocumentClass } from '../src/trade-trust/trade-trust.types';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const accountsService = app.get(AccountsService);
  const tradeDocsRepo = app.get(TradeDocumentsRepository);
  const dvpRepo = app.get(DvpSettlementRepository);

  console.log('Seeding mock data for mLETR DvP...');

  // Ensure account exists
  let accountId = 'acc-test-123';
  if (!(await accountsService.accountExists(accountId))) {
    console.log('Creating test account...');
    const account = await accountsService.createAccount({
      name: 'Test Import/Export Corp',
      // Provide valid account creation details per backend DTO requirements
      description: 'Test Account for DvP Seed',
      settings: {}
    } as any);
    accountId = account.id?.toString() || (account as any)._id?.toString();
  }

  // Create an issued trade document
  console.log('Creating issued Trade Document...');
  const doc = await tradeDocsRepo.createTradeDocument(
    accountId,
    {
      documentType: TradeDocumentType.BILL_OF_LADING,
      documentReference: `BL-SEED-${Math.floor(Math.random() * 10000)}`,
      documentContent: {
        blNumber: 'BL-9923841',
        consignor: { companyName: 'Oceanic Freight Ltd', address: '1 Port Rd' } as any,
        consignee: { companyName: 'Global Imports Inc', address: '2 Dist Ave' } as any,
        // @ts-ignore - bypassing strict typings for the test seed
        freightCharges: { value: 24500, currency: 'USD' }
      },
      claimants: {
        owner: { walletAddress: '0xSellerWalletAddressHere' },
        beneficiary: { walletAddress: '0xSellerWalletAddressHere' }
      }
    },
    TradeDocumentStatus.ISSUED
  );

  await tradeDocsRepo.updateTradeDocumentStatus(accountId, doc.id, TradeDocumentStatus.ISSUED);
  
  // Directly inject issue details into DB for testing
  const MongooseModel = (tradeDocsRepo as any).tradeDocumentModel;
  await MongooseModel.updateOne(
    { _id: doc.id },
    { 
      $set: {
        issueDetails: {
          documentClass: TradeTrustDocumentClass.TRANSFERABLE,
          merkleRoot: '0xmockMerkleRoot' + Math.random().toString(16).slice(2),
          transactionHash: '0xmockTxHash' + Math.random().toString(16).slice(2)
        }
      }
    }
  );

  console.log(`Document created with ID: ${doc.id}`);

  // Need to clear existing settlements for this document ID before creating
  try {
     const existingSettlement = await dvpRepo.findByDocumentId(accountId, doc.id);
     if (existingSettlement) {
         await dvpRepo.updateStatus(accountId, existingSettlement.id, DvpSettlementStatus.CANCELLED);
     }
  } catch(e) {}

  // Create a pending settlement
  console.log('Creating DVP Settlement...');
  const settlement = await dvpRepo.create({
    accountId,
    settlementReference: `DVP-SEED-${Math.floor(Math.random() * 10000)}`,
    status: DvpSettlementStatus.AWAITING_PAYMENT,
    document: {
      tradeDocumentId: doc.id,
      documentType: TradeDocumentType.BILL_OF_LADING,
      merkleRoot: '0xmockMerkleRoot'
    },
    payment: {
      stablecoin: StablecoinType.USDC,
      amount: "24500",
      amountAtomic: "24500000000",
      tokenContractAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", // Polygon Amoy USDC
      decimals: 6,
      buyerWalletAddress: "0xBuyerWalletAddressHere",
      sellerWalletAddress: "0xSellerWalletAddressHere",
      escrowWalletAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
    },
    mletrAttributes: {
      isElectronicTransferableRecord: true,
      controlMethod: 'TOKEN_REGISTRY',
      documentReference: 'BL-9923841',
      sellerParty: 'Oceanic Freight Ltd',
      buyerParty: 'Global Imports Inc'
    },
    agentDecisions: [
      {
        timestamp: new Date(),
        action: 'VALIDATE_MLETR_COMPLIANCE',
        reasoning: 'Document meets mLETR electronic transferable record requirements',
        confidence: 0.95
      },
      {
        timestamp: new Date(),
        action: 'EXTRACT_SETTLEMENT_TERMS',
        reasoning: 'Extracted settlement: 24500 USD between Oceanic Freight Ltd and Global Imports Inc',
        confidence: 0.9
      }
    ]
  });

  console.log(`Settlement created with ID: ${settlement.id}`);
  console.log(`\nView it at: http://localhost:3000/settlement/${settlement.id}\n`);

  await app.close();
}

bootstrap().catch(err => {
  console.error(err);
  process.exit(1);
});
