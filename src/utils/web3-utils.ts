import { ethers,  providers } from 'ethers-v5';

export function getPaperlessSigner(provider: providers.JsonRpcProvider) {
  const privateKey = process.env.ISSUER_WALLET_KEY;
  if (!privateKey) {
    throw new Error(
      'The Paperless Private Key or Document Signing RPC Url was not set',
    );
  }

  return new ethers.Wallet(privateKey, provider);
}

export function getDocumentSigningSigner(provider: providers.JsonRpcProvider) {
  const privateKey = process.env.DOCUMENT_SIGNING_WALLET_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error(
      'The Paperless Document Signing Wallet Private Key or Document Signing RPC Url was not set',
    );
  }

  return new ethers.Wallet(privateKey, provider);
}

export async function getGasFees(gasStationUrl: string) {
  const suggestedPriceResponse = await fetch(gasStationUrl);
  const suggestedPriceObject = await suggestedPriceResponse.json();
  return suggestedPriceObject.standard;
}
