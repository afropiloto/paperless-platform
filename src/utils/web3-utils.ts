import { ethers,  providers } from 'ethers-v5';

export function getPaiperlessSigner(provider: providers.JsonRpcProvider) {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error(
      'The Paiperless Private Key or Document Signing RPC Url was not set',
    );
  }

  return new ethers.Wallet(privateKey, provider);
}

export async function getGasFees(gasStationUrl: string) {
  const suggestedPriceResponse = await fetch(gasStationUrl);
  const suggestedPriceObject = await suggestedPriceResponse.json();
  return suggestedPriceObject.standard;
}
