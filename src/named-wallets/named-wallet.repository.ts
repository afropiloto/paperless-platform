import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { NamedWallet } from './schemas/named-wallet.schema';
import { CreateNamedWalletDto, NamedWalletDto, UpdateNamedWalletDto } from './dtos/named-wallets.dto';
import { plainToInstance } from 'class-transformer';
import { SearchQueryDto } from '../trade-documents/dtos/search-trade-documents.dto';
import { NamedWalletsSearchResultsDto } from './dtos/named-wallets-search-results.dto';


@Injectable()
export class NamedWalletsRepository {
  private readonly logger = new Logger(NamedWalletsRepository.name);

  constructor(@InjectModel(NamedWallet.name) private namedWalletModel: Model<NamedWallet>) {}


  async getAccountWallets(accountId: string, searchParams: SearchQueryDto) {
    const dataFacet = []
    if (searchParams.orderBy !== undefined && searchParams.orderBy.length > 0) {
      dataFacet.push({
        $sort: {[searchParams.orderBy]: searchParams.orderDirection === 'desc' ? -1 : 1}
      })
    }
    dataFacet.push({$skip: (searchParams.page - 1) * searchParams.limit})
    dataFacet.push({$limit: searchParams.limit})
    const searchableFields = ["walletAddress", "walletName", "emailAddress"]

    const aggregationPipeline: PipelineStage[] = [];
    // Add filter to restrict data to the wallet address
    aggregationPipeline.push(
      {$match: {"accountId": accountId}},
      {$project: {id: "$_id", walletAddress: 1, emailAddress: 1, walletName: 1}},
      {$project: { accountWalletAddress: 0, __v: 0, _id: 0}},
    )

    // Add filter criteria if a query term is provided
    if (searchParams.queryTerm !== undefined && searchParams.queryTerm.length > 0) {
      aggregationPipeline.push({
        $match: {
          $or: searchableFields.map(field => ({
            [field]: {$regex: searchParams.queryTerm, $options: "i"},
          }))
        }
      })
    }
    // Facets
    aggregationPipeline.push({
      $facet: {
        metadata: [
          {
            $count: 'totalDocuments',
          },
          {
            $addFields: {
              page: searchParams.page,
              totalPages: {$ceil: {$divide: ["$totalDocuments", searchParams.limit]}},
              limit: searchParams.limit,
            }
          }
        ],
        data: dataFacet
      }
    })

    try {
      let result = await this.namedWalletModel.aggregate(aggregationPipeline)

      result = result[0]
      result["metadata"] = {...result["metadata"][0]}
      return result as NamedWalletsSearchResultsDto;
    } catch (error) {
      this.logger.error({msg: "Failed to retrieve  Named Wallet for account", details: error.message, accountWalletAddress: accountId, searchParams});
      throw new Error("We encountered an problem retrieving your named wallets. We have logged this issue please try again later");
    }
  }

  async accountWalletAddressExists(accountId: string, walletAddress: string): Promise<boolean> {
    return (await this.namedWalletModel.exists({accountId, walletAddress})) !== null;
  }


  async getAccountWalletById(accountId: string, walletId: string): Promise<NamedWalletDto> {
    const results = await this.namedWalletModel.findOne({accountId, _id: walletId})
      .lean().exec();

    return results ? plainToInstance(NamedWalletDto, {id: results._id, ...results}, {excludeExtraneousValues: true} ): null;
  }

  async createNamedWallet(accountId: string, newWalletDetails: CreateNamedWalletDto) {
    const namedWallet =  await this.namedWalletModel.create({ accountId, ...newWalletDetails });
    return plainToInstance(NamedWalletDto, {id: namedWallet._id, ...namedWallet}, {excludeExtraneousValues: true});
  }

  async updateNamedWallet(accountId: string, walletId: string, updates: UpdateNamedWalletDto) {
    const updatedWalletDetails = await this.namedWalletModel.findOneAndUpdate({
      accountId,
      _id: walletId
    }, { ...updates }, { returnDocument: "after" });

    return plainToInstance(NamedWalletDto, {id: updatedWalletDetails._id, ...updatedWalletDetails}, {excludeExtraneousValues: true})
  }


  async deleteAccountWallet(accountId: string, walletId: string) {
    const result = await this.namedWalletModel.deleteOne({
      accountId,
      _id: walletId
    })
    return result.deletedCount !== 0;
  }
}