
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OnboardingProcessing } from './schemas/onboarding.schema';
import { Model, PipelineStage, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { NewOnboardingRequestDto } from './dtos/create-onboarding-processing.dto';
import {
  OnboardingProcessingResponseDto,
  OnboardingProcessingSearchResultsDto,
} from './dtos/onboarding-processing-response.dto';
import { plainToInstance } from 'class-transformer';
import { SearchQueryDto, SortDirection } from '../common/dtos/search.dto';
import { OnboardingDecision, OnboardingStatus } from './types/onboarding.types';
import { OnboardingAnalyticsDto } from './dtos/analytics.dto';


@Injectable()
export class OnboardingRepository {
  private readonly logger = new Logger(OnboardingRepository.name);

  constructor(
    @InjectModel(OnboardingProcessing.name)
    private readonly onboardingProcessingModel: Model<OnboardingProcessing>,
  ){}

  async create(onboardingProcessing: NewOnboardingRequestDto): Promise<OnboardingProcessingResponseDto> {
    try {
      const newOnboardingRecord = new this.onboardingProcessingModel({ ...onboardingProcessing });
      const newOnboarding = await newOnboardingRecord.save();

      return plainToInstance(OnboardingProcessingResponseDto, newOnboarding);
    } catch (error) {
      this.logger.error(`Failed to create new Onboarding record: ${error.message}`);
      throw error;
    }
  }

  async findById(id: string): Promise<OnboardingProcessingResponseDto> {
    try {
      const aggregationPipeline: PipelineStage[] = [
        {
          $match: {
            _id: new Types.ObjectId(id),
          },
        },
        {
          $lookup: {
            from: 'registrations',
            localField: 'registrationId',
            foreignField: 'registrationId',
            as: 'registration',
          },
        },
        {
          $addFields: {
            companyName: { $arrayElemAt: ['$registration.company.name', 0] },
          },
        },
        {
          $project: {
            _id: { $toString: '$_id' },
            registrationId: 1,
            companyName: 1,
            status: 1,
            onboardingDecision: 1,
            dueDiligenceChecklistId: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ];

      const result = await this.onboardingProcessingModel
        .aggregate(aggregationPipeline)
        .exec();
      this.logger.debug({ result });

      if (!result || result.length === 0) {
        throw new NotFoundException(`Onboarding processing with id ${id} not found`);
      }


      return plainToInstance(OnboardingProcessingResponseDto, result[0]);
    } catch (error) {
      this.logger.error(
        `Failed to find Onboarding Processing by id ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  async findAll(searchParams?: SearchQueryDto): Promise<OnboardingProcessingSearchResultsDto> {
    try {
      const {
        queryTerm,
        page = 1,
        limit = 10,
        orderBy = 'updatedAt',
        orderDirection = SortDirection.DESC
      } = searchParams || {};

      const skip = (page - 1) * limit;
      const sortDirection = orderDirection === SortDirection.ASC ? 1 : -1;

      // Build match stage for search
      const matchStage: any = {};
      if (queryTerm) {
        matchStage.$or = [
          { accountName: { $regex: queryTerm, $options: 'i' } },
          { dealReference: { $regex: queryTerm, $options: 'i' } },
          { status: { $regex: queryTerm, $options: 'i' } }
        ];
      }

      // Base pipeline with lookups and field additions
      const basePipeline: PipelineStage[] = [
        {
          $lookup: {
            from: 'registrations',
            localField: 'registrationId',
            foreignField: 'registrationId',
            as: 'registration',
          },
        },
        {
          $addFields: {
            companyName: { $arrayElemAt: ['$registration.company.name', 0] },
          },
        },
        {
          $project: {
            _id: { $toString: '$_id' },
            registrationId: 1,
            companyName: 1,
            status: 1,
            onboardingDecision: 1,
            dueDiligenceChecklistId: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ];

      // Add search filter if query term exists
      if (Object.keys(matchStage).length > 0) {
        basePipeline.push({ $match: matchStage });
      }

      // Get total count for pagination
      const countPipeline = [...basePipeline, { $count: 'total' }];
      const totalRecords = await this.onboardingProcessingModel
        .aggregate(countPipeline)
        .exec();

      const total = totalRecords[0]?.total || 0;
      const totalPages = Math.ceil(total / limit);

      // Build data pipeline with sorting and pagination
      const dataPipeline: PipelineStage[] = [
        ...basePipeline,
        { $sort: { [orderBy]: sortDirection as 1 | -1 } },
        { $skip: skip },
        { $limit: limit }
      ];

      const results = await this.onboardingProcessingModel
        .aggregate(dataPipeline)
        .exec();

      const data = results.map(result =>
        plainToInstance(OnboardingProcessingResponseDto, result, {
          excludeExtraneousValues: true,
        })
      );
      const searchResults = {
        data,
        metadata: {
          page,
          totalPages,
          limit
        }
      };
      return plainToInstance(OnboardingProcessingSearchResultsDto, searchResults);
    } catch (error) {
      this.logger.error(
        `Failed to find all deal processing records: ${error.message}`,
      );
      throw error;
    }
  }


  private getDealProcessingStatus(decision: OnboardingDecision) {
    switch (decision) {
      case OnboardingDecision.APPROVED:
        return OnboardingStatus.COMPLETED;
      case OnboardingDecision.DECLINED:
        return OnboardingStatus.COMPLETED;
      default:
        return OnboardingStatus.IN_PROGRESS;
    }
  }

  private getDealDecision(decision: OnboardingDecision) {
    switch (decision.toString().toLowerCase()) {
      case 'approve':
      case 'approved':
        return OnboardingDecision.APPROVED;
      case 'decline':
      case 'declined':
        return OnboardingDecision.DECLINED;
      default:
        return OnboardingDecision.PENDING;
    }
  }
  async updateOnboardingDecision(
    id: string,
    decision: OnboardingDecision,
    note: string,
    user?: string
  ): Promise<OnboardingProcessingResponseDto>{
    try {
      this.logger.debug({ decision });
      const dealDecision = this.getDealDecision(decision);
      const dealStatus = this.getDealProcessingStatus(dealDecision);

      this.logger.debug({ dealStatus });
      const result =  await this.onboardingProcessingModel
        .findByIdAndUpdate(
          id,
          {
            $set: {
              fundingDecision: {
                decision: dealDecision,
                decisionNotes: {
                  note,
                  user,
                  createdAt: new Date()
                }
              },
              status: dealStatus,
            },
          },
          { new: true },
        )
        .exec();

      return plainToInstance(OnboardingProcessingResponseDto, result);
    } catch (error) {
      this.logger.error(
        `Failed to update funding decision for deal processing ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  async getAnalytics(): Promise<OnboardingAnalyticsDto> {
    try {
      const pipeline: PipelineStage[] = [
        {
          $facet: {
            totalNew: [
              {
                $match: {
                  status: OnboardingStatus.NEW
                }
              },
              {
                $count: 'count'
              }
            ],
            totalInProgress: [
              {
                $match: {
                  status: OnboardingStatus.IN_PROGRESS
                }
              },
              {
                $count: 'count'
              }
            ]
          }
        }
      ];

      const [result] = await this.onboardingProcessingModel.aggregate(pipeline).exec();

      return plainToInstance(OnboardingAnalyticsDto,
        {
          totalNew: result.totalNew[0]?.count || 0,
          totalInProgress: result.totalInProgress[0]?.count || 0,
      }
  )
    } catch (error) {
      this.logger.error(`Failed to get deal analytics: ${error.message}`);
      throw error;
    }
  }

}