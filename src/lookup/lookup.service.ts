import { LookupRepository } from './lookup.repository';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ChainLookupDict } from './chain-lookup.types';
import { DEFAULT_LOOKUP_TTL_MS } from './lookup.module';
import { ChainLookupDTO } from './dtos/chain-lookup.dto';

const CHAIN_BY_ID_LOOKUP = 'chain_by_id_data';
const CHAIN_BY_NAME_LOOKUP = 'chain_by_name_data';

@Injectable()
export class LookupService {
  private readonly logger = new Logger(LookupService.name);

  constructor(
    private readonly lookupRepository: LookupRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async getChainDetailsByName(chainName: string): Promise<ChainLookupDTO> {
    const cachedData =
      await this.cacheManager.get<ChainLookupDict>(CHAIN_BY_NAME_LOOKUP);
    if (cachedData && chainName.toLowerCase() in cachedData) {
        return cachedData[chainName.toLowerCase()];
    }

    const freshData = await this.lookupRepository.getSupportedChains();

    const dictionary: ChainLookupDict = freshData.reduce(
      (dictionary, network) => {
        dictionary[network.chainName.toLowerCase()] = {
          chainName: network.chainName,
          chainId: network.chainId,
          gasStation: network.gasStation,
          rpcUrl: network.rpcUrl,
        };
        return dictionary;
      },
      {},
    );

    await this.cacheManager.set<ChainLookupDict>(
      CHAIN_BY_NAME_LOOKUP,
      dictionary,
      DEFAULT_LOOKUP_TTL_MS,
    );
    if (chainName.toLowerCase() in dictionary) {
      return dictionary[chainName.toLowerCase()];
    } else {
      throw new NotFoundException(`Chain Name ${chainName} is not supported.`);
    }
  }

  async getChainDetailsByChainId(chainId: string) {
    const cachedData =
      await this.cacheManager.get<ChainLookupDict>(CHAIN_BY_ID_LOOKUP);
    if (cachedData && chainId in cachedData) {
      return cachedData[chainId] as ChainLookupDTO;
    }

    const freshData = await this.lookupRepository.getSupportedChains();

    const dictionary: ChainLookupDict = freshData.reduce(
      (dictionary, network) => {
        dictionary[network.chainId] = {
          chainName: network.chainName,
          chainId: network.chainId,
          gasStation: network.gasStation,
          rpcUrl: network.rpcUrl,
        };
        return dictionary;
      },
      {},
    );

    await this.cacheManager.set<ChainLookupDict>(
      CHAIN_BY_ID_LOOKUP,
      dictionary,
      DEFAULT_LOOKUP_TTL_MS,
    );
    if (chainId in dictionary) {
      return dictionary[chainId] as ChainLookupDTO;
    } else {
      throw new NotFoundException(`Chain ID ${chainId} is not supported.`);
    }
  }

  async addSupportedChain(chainDetails: ChainLookupDTO) {
    const newChainDetails =
      await this.lookupRepository.createSupportedChain(chainDetails);
    // Invalidate the cache so it is picked up again
    await this.cacheManager.del(CHAIN_BY_ID_LOOKUP);
    return newChainDetails;
  }
}
