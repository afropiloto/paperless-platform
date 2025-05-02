export interface ChainLookupDict {
  [key: string]: {
    chainName: string;
    chainId: string;
    rpcUrl: string;
    gasStation: string;
  };
}