import { Injectable, Logger } from '@nestjs/common';


@Injectable()
export class DealDeskRepository {
  private readonly logger = new Logger(DealDeskRepository.name);

}