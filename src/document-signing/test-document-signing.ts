import { ethers } from 'ethers-v5';
import { DocumentSigningContractService } from './document-signing-contract.service';
import fs from 'fs';

/**
 * NodeJS example with ethers.js and file system
 */

const mainAccount = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const mainAccountPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const otherAccount = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const otherAccountPrivateKey = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const nonSigningAccount = "0x90F79bf6EB2c4f870365E785982E1f101E93b906";
const nonSigningAccountPrivateKey = "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6"

const rpcUrl = 'http://127.0.0.1:8545'
const contractAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
const testPdf = "C:/Users/billm/Downloads/invoice_example (2).pdf";

async function nodeJsExample() {

  // Load private key (NEVER hardcode in production, use secure environment variables)
  const privateKey = mainAccountPrivateKey


  // Connect to an Ethereum node
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

  const mainWallet = new ethers.Wallet(privateKey, provider);
  const otherWallet = new ethers.Wallet(otherAccountPrivateKey, provider);
  const nonSignerProvider = new ethers.Wallet(nonSigningAccountPrivateKey, provider);


  // Create document signing service
  const documentService = new DocumentSigningContractService(contractAddress, mainWallet);

  // Read PDF file
  const pdfBuffer = fs.readFileSync(testPdf);

  // Define signers
  const signers = [otherAccount,
    mainWallet.address
  ];

  // Create document signing request
  console.log('Creating document signing request...');
  const documentId = await documentService.createDocument(pdfBuffer, signers, 30);
  console.log('Document created with ID:', documentId);

  console.log('Obtaining document signing information');
  await documentService.getDocumentStatus(documentId)
    .then(documentStatus => {
      console.log(JSON.stringify(documentStatus));
    });
  console.log('Obtaining document signers');
  await documentService.getRequiredSigners(documentId)
    .then(signers => {
      console.log(JSON.stringify(signers));
    });
  console.log('Obtaining document signer status');
  await documentService.hasUserSigned(documentId, mainAccount)
    .then(signed => {
      console.log(`Main Wallet: ${signed}`);
    });
  await documentService.hasUserSigned(documentId, otherAccount)
    .then(signed => {
      console.log(`Other  Wallet: ${signed}`);
    });

  // //
  // // ATTEMPT NON-SIGNER SIGN EVENT
  // //
  // try {
  //   console.log('Attempting non-signer signing document...');
  //   const nonSignerReceipt = await documentService.signDocument(documentId, pdfBuffer, nonSignerProvider);
  //   console.log('Document signed:', nonSignerReceipt.transactionHash);
  // }
  // catch (error) {
  //   console.log(`Non signer prevented from signing. Error: ${error.error.reason}`);
  //   }


  //
  // OWNER SIGN EVENT
  //
  console.log('Owner Signing document...');
  const receipt = await documentService.ownerSignDocument(documentId, pdfBuffer);
  console.log('Document signed:', receipt.transactionHash);

  console.log('Obtaining document signing information');
  await documentService.getDocumentStatus(documentId)
    .then(documentStatus => {
      console.log(JSON.stringify(documentStatus));
    });

  console.log('Obtaining document signers');
  await documentService.getRequiredSigners(documentId)
    .then(signers => {
      console.log(JSON.stringify(signers));
    });

  console.log('Obtaining document signer status');
  await documentService.hasUserSigned(documentId, mainAccount)
    .then(signed => {
      console.log(`Main Wallet: ${signed}`);
    });
  await documentService.hasUserSigned(documentId, otherAccount)
    .then(signed => {
      console.log(`Other  Wallet: ${signed}`);
    });

  //
  // OTHER SIGNER SIGN EVENT
  //
  console.log('Other Account Signing document...');
  const otherReceipt = await documentService.signDocument(documentId, pdfBuffer, otherWallet);
  console.log('Document signed:', otherReceipt.transactionHash);


  console.log('Obtaining document signing information');
  await documentService.getDocumentStatus(documentId)
    .then(documentStatus => {
      console.log(JSON.stringify(documentStatus));
    });
}


nodeJsExample()
  .then(() => {
    console.log("Done")
  })