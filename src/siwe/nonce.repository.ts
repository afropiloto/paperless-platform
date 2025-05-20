import { Injectable, Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Nonce } from './schemas/nonce.schema';

@Injectable()
export class NonceRepository {
  private readonly logger = new Logger(NonceRepository.name);

  constructor(
    @InjectModel(Nonce.name) private readonly nonceModel: Model<Nonce>,
  ) {}

  async findNonceByWallet(wallet: string) {
    const result = await this.nonceModel.findOne({ wallet }).lean().exec();

    return result ? result : null;
  }

  async addNonceForWallet(wallet: string, nonce: string) {
    return await this.nonceModel.create({
      wallet,
      nonce
    });
  }

  async deleteNonceByWallet(wallet: string) {
    await this.nonceModel.deleteOne({ wallet });
  }
}