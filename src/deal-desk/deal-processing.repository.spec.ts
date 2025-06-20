import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { DealProcessingRepository } from './deal-processing.repository';
import { DealProcessing } from './schemas/deal-processing.schema';
import { Account } from '../accounts/schemas/account.schema';
import { TradeFinance } from '../trade-finance/schemas/trade-finance.schema';
import { SearchQueryDto, SortDirection } from '../common/dtos/search.dto';

describe('DealProcessingRepository', () => {
  let repository: DealProcessingRepository;
  let dealProcessingModel: any;
  let accountModel: any;
  let tradeFinanceModel: any;

  const mockDealProcessingModel = {
    aggregate: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    save: jest.fn(),
  };

  const mockAccountModel = {
    aggregate: jest.fn(),
  };

  const mockTradeFinanceModel = {
    aggregate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DealProcessingRepository,
        {
          provide: getModelToken(DealProcessing.name),
          useValue: mockDealProcessingModel,
        },
        {
          provide: getModelToken(Account.name),
          useValue: mockAccountModel,
        },
        {
          provide: getModelToken(TradeFinance.name),
          useValue: mockTradeFinanceModel,
        },
      ],
    }).compile();

    repository = module.get<DealProcessingRepository>(DealProcessingRepository);
    dealProcessingModel = module.get(getModelToken(DealProcessing.name));
    accountModel = module.get(getModelToken(Account.name));
    tradeFinanceModel = module.get(getModelToken(TradeFinance.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated results with search functionality', async () => {
      const searchParams: SearchQueryDto = {
        queryTerm: 'test',
        page: 1,
        limit: 10,
        orderBy: 'updatedAt',
        orderDirection: SortDirection.DESC,
      };

      const mockCountResult = [{ total: 25 }];
      const mockDataResult = [
        {
          _id: '1',
          dealId: 'deal1',
          accountId: 'account1',
          accountName: 'Test Account',
          dealReference: 'DEAL-001',
          status: 'IN_PROGRESS',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock the count aggregation
      dealProcessingModel.aggregate
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockCountResult),
        })
        // Mock the data aggregation
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockDataResult),
        });

      const result = await repository.findAll(searchParams);

      expect(result).toEqual({
        data: expect.arrayContaining([
          expect.objectContaining({
            _id: '1',
            accountName: 'Test Account',
            dealReference: 'DEAL-001',
          }),
        ]),
        metadata: {
          page: 1,
          totalPages: 3,
          limit: 10,
        },
      });

      // Verify that aggregate was called twice (once for count, once for data)
      expect(dealProcessingModel.aggregate).toHaveBeenCalledTimes(2);
    });

    it('should handle search without query term', async () => {
      const searchParams: SearchQueryDto = {
        page: 1,
        limit: 5,
      };

      const mockCountResult = [{ total: 10 }];
      const mockDataResult = [];

      dealProcessingModel.aggregate
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockCountResult),
        })
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockDataResult),
        });

      const result = await repository.findAll(searchParams);

      expect(result.metadata).toEqual({
        page: 1,
        totalPages: 2,
        limit: 5,
      });
    });

    it('should handle empty results', async () => {
      const searchParams: SearchQueryDto = {
        queryTerm: 'nonexistent',
        page: 1,
        limit: 10,
      };

      const mockCountResult = [{ total: 0 }];
      const mockDataResult = [];

      dealProcessingModel.aggregate
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockCountResult),
        })
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockDataResult),
        });

      const result = await repository.findAll(searchParams);

      expect(result).toEqual({
        data: [],
        metadata: {
          page: 1,
          totalPages: 0,
          limit: 10,
        },
      });
    });
  });
}); 