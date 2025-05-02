


export async function getGasFees(gasStationUrl: string ){
  const suggestedPriceResponse = await fetch(gasStationUrl);
  const suggestedPriceObject = await suggestedPriceResponse.json();
  return suggestedPriceObject.standard;

}
