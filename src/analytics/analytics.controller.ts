import {
  Controller,
  Logger
} from '@nestjs/common';
import {ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';




@Controller('analytics')
@ApiTags('Account Analytics')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);
  constructor(private readonly analyticsService: AnalyticsService) {}


}
