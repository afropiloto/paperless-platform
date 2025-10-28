import {
  Body,
  Controller, FileTypeValidator, Get, Logger, MaxFileSizeValidator, Param,
  ParseFilePipe,
  Post, Res, UploadedFile, UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { RegistrationService } from './registration.service';
import { CreateRegistrationDto } from './dtos/create-registration.dto';
import { GeneralResponseDto } from '../common/common-dto';
import { UploadRegistrationDocumentDto } from './dtos/upload-registration-document.dto';
import { RegistrationDetailsDto } from './dtos/registration-details.dto';
import { Response } from 'express';
import { ApiKeyGuard } from 'src/api-key-auth/api-key.guard';
import { ClientAccess } from 'src/api-key-auth/decorators/client-access.decorator';
import { ClientAccessGroup } from 'src/api-key-auth/types/api-key-auth.types';

@ApiTags('Registration')
@Controller('registration')
@UseGuards(ApiKeyGuard)
@ApiHeader({
  name: 'x-api-key',
  description: 'The Client Application API Key',
  example: '47f19331:86382a9cbeaa603325628d29859b10fa6df94385ef792ea340cb1208ab9fdb6e'
})
@ClientAccess(ClientAccessGroup.PAPERLESS_APP, ClientAccessGroup.PAPERLESS_PORTAL)
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

  @Get(':registrationId/files/:fileId')
  @ApiOperation({
                 summary:
                 'Retrieves the registration document file content',
               })
  @ApiResponse({ status: 200, description: 'Document File retrieved' })
  @ApiResponse({
    status: 400,
    description: 'registrationId or fileId is invalid',
  })
  @ApiResponse({
    status: 404,
    description: 'Registration Document not be found',
  })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to retrieve Registration Document details',
  })
  async getRegistrationDocumentFile(
    @Param('registrationId') registrationId: string,
    @Param('fileId') fileId: string,
    @Res() res: Response
  ) {

    const {stream, headers} = await this.registrationService.getDocumentFileStream(registrationId, fileId);
    res.set(headers);

    return stream.pipe(res);
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
    return await this.registrationService.getRegistrationDetails(registrationId);

  }

}
