import {
  Body,
  Controller, FileTypeValidator, Get, Logger, MaxFileSizeValidator, Param,
  ParseFilePipe,
  Post, UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { RegistrationService } from './registration.service';
import { CreateRegistrationDto } from './dtos/create-registration.dto';
import { GeneralResponseDto } from '../common/common-dto';
import { UploadRegistrationDocumentDto } from './dtos/upload-registration-document.dto';
import { RegistrationDetailsDto } from './dtos/registration-details.dto';

@ApiTags('Registration')
@Controller('registration')
export class RegistrationController {
  private readonly logger = new Logger(RegistrationController.name);
  constructor(private readonly registrationService: RegistrationService) {}

  @Post('/')
  @ApiOperation({ summary: 'Register a new customer' })
  @ApiResponse({
    status: 201,
    description: 'Customer successfully registered',
    type: RegistrationDetailsDto
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async registerCustomer(
    @Body() createCustomerDto: CreateRegistrationDto,
  ) {
    return  await this.registrationService.createRegistration(createCustomerDto);
  }

  @Post(':registrationId/documents')
  @ApiOperation({ summary: 'Upload a document to an existing registration' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        documentType: {
          type: 'string',
          enum: ['ProofOfAddress', 'CompanyRegistration']
        },
        file: {
          type: 'string',
          format: 'binary'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Document successfully uploaded',
    type: GeneralResponseDto
  })
  @ApiResponse({ status: 400, description: 'Invalid input data or file upload' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Param('registrationId') registrationId: string,
    @Body() uploadDocumentDto: UploadRegistrationDocumentDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: /^(image\/jpeg|image\/png|image\/gif|application\/pdf)$/,}),
        ],
      }),
    )
      file: Express.Multer.File,
  ): Promise<RegistrationDetailsDto> {

    //throw new BadRequestException("Invalid file type");
    return await this.registrationService.uploadDocument(
      registrationId,
      file,
      uploadDocumentDto,
    );

  }

  @Get(':registrationId')
  @ApiOperation({ summary: 'Retrieves Registration Details'})
  @ApiResponse({
    status: 200,
    description: 'Registration Details successfully retrieved',
    type: RegistrationDetailsDto
  })
  @ApiResponse({
    status: 404,
    description: 'Registration Details not found'
  })
  async getRegistrationDetails(@Param('registrationId') registrationId: string) {
    const response = await this.registrationService.getRegistrationDetails(registrationId);
    this.logger.debug({response});
    return response;

  }

}
