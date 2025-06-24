import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { RegistrationRepository } from './registration.repository';
import { CreateRegistrationDto } from './dtos/create-registration.dto';
import { FileStorageService } from '../file-storage/file-storage.interface';
import { FILE_STORAGE_SERVICE } from '../file-storage/file-storage.constants';
import { RegistrationDetailsDto } from './dtos/registration-details.dto';
import { UploadRegistrationDocumentDto } from './dtos/upload-registration-document.dto';
import { AccountsService } from '../accounts/accounts.service';
import { RegistrationDocumentFileDetails } from './models/registration-document-file-details';

@Injectable()
export class RegistrationService {
  private readonly logger = new Logger(RegistrationService.name);

  constructor(
    private readonly accountsService: AccountsService,
    private readonly registrationRepository: RegistrationRepository,
    @Inject(FILE_STORAGE_SERVICE)
    private readonly fileStorageService: FileStorageService,
  ) {}

  async createRegistration(
    createRegistrationDto: CreateRegistrationDto
  ): Promise<RegistrationDetailsDto> {

    // Validation checks
    const [registrationExistsCheck, accountExistsCheck] = await Promise.all([
      this.registrationRepository.registrationForWalletAddressExists(createRegistrationDto.company.accountWalletAddress),
      this.accountsService.accountForWalletAddressExists(createRegistrationDto.company.accountWalletAddress)
    ])
    if (registrationExistsCheck || accountExistsCheck) {
      throw new BadRequestException('Registration or Account for this wallet address already exists');
    }

    return this.registrationRepository.create(createRegistrationDto);
  }

  async uploadDocument(registrationId: string, file: Express.Multer.File, metadata: UploadRegistrationDocumentDto): Promise<RegistrationDetailsDto> {
    const customer = await this.registrationRepository.findByRegistrationId(registrationId);

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${registrationId} not found`);
    }

    // ToDo: Need to Implement Virus scanning here (use shallow scan before storing then schedule for deeper scan)
    const {storedFileName, storedFilePath} = await this.fileStorageService.uploadFile(file.buffer, file.originalname, file.mimetype);

    const registrationDocumentDetails: RegistrationDocumentFileDetails = {
      storedFileName: storedFileName,
      storedFilePath: storedFilePath,
      originalFilename: file.originalname,
      documentType: metadata.documentType,
      mimeType: file.mimetype,
      size: file.size
    }

    return this.registrationRepository.addDocument(registrationId, registrationDocumentDetails);
  }

  async getRegistrationDetails(registrationId: string): Promise<RegistrationDetailsDto> {
    return this.registrationRepository.findByRegistrationId(registrationId);
  }

  async getDocumentFileStream(registrationId: string, fileId: string) {
    const fileDetails = await this.registrationRepository.getFileDetailsById(registrationId, fileId)

    if (!fileDetails || !fileDetails.storedFileName) {
      throw new NotFoundException("Registration Document File Not Found");
    }
    return {
      stream: this.fileStorageService.streamFile(fileDetails.storedFileName),
      headers: {
        'Content-Disposition': `attachment; filename="${fileDetails.originalFilename || 'download'}"`,
        'Content-Type': fileDetails.mimeType || 'application/octet-stream',
      }
    };
  }
}
