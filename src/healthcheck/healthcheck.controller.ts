import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { HealthCheckResponseDto } from './dtos/healthcheck.dto';

@ApiTags('Healthcheck')
@Controller('healthcheck')
export class HealthcheckController {
  @Get('/')
  @ApiOperation({ summary: 'Gets the current server heath' })
  @ApiResponse({ status: 200, description: 'Server is up and running' })
  async getHealthcheck(): Promise<HealthCheckResponseDto> {
    const healthcheck = new HealthCheckResponseDto();
    healthcheck.status = "running";
    return plainToInstance(HealthCheckResponseDto, healthcheck);
  }
}
