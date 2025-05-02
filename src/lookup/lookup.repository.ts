import { Injectable, Logger } from '@nestjs/common';
import { ChainLookup } from './schema/chain-lookup.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { plainToInstance } from 'class-transformer';
import { ChainLookupDTO } from './dtos/chain-lookup.dto';


@Injectable()
export class LookupRepository {
  private readonly logger = new Logger(LookupRepository.name);
  constructor(@InjectModel(ChainLookup.name) private readonly chainLookupModel: Model<ChainLookup>) {}

  async getSupportedChains() {
    const chains = await this.chainLookupModel.find().lean().exec();
    return chains.length > 0 ? plainToInstance(ChainLookupDTO, chains) : [];
  }

  async createSupportedChain(chainDetails: ChainLookupDTO): Promise<ChainLookupDTO> {
    const createdDocument = await this.chainLookupModel.create(chainDetails)

    return plainToInstance(ChainLookupDTO, createdDocument);
  }
}