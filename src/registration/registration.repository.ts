import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Registration } from './schemas/registration.schema';
import { plainToInstance } from 'class-transformer';
import { RegistrationDetailsDto } from './dtos/registration-details.dto';
import { CreateRegistrationDto } from './dtos/create-registration.dto';
import { RegistrationDocumentFileDetails } from './models/registration-document-file-details';

@Injectable()
export class RegistrationRepository {
  private readonly logger = new Logger(RegistrationRepository.name);

  constructor(@InjectModel(Registration.name)
              private registrationModel: Model<Registration>){}


  async create(registration: CreateRegistrationDto): Promise<RegistrationDetailsDto> {
    const createdRegistration = await this.registrationModel.create(registration);
    return plainToInstance(RegistrationDetailsDto, createdRegistration.toObject());
  }

  async findByRegistrationId(registrationId: string): Promise<RegistrationDetailsDto > {
    const registration =  await this.registrationModel.findOne({registrationId:registrationId}).lean().exec();
    if (!registration) {throw new NotFoundException('Registration not found');}
    return registration ? plainToInstance(RegistrationDetailsDto, registration) : null
  }

  async update(registrationId: string, updates: Registration) {
    const updated = await this.registrationModel.findOneAndUpdate({registrationId: registrationId}, updates);
    if (!updated) {
      throw new NotFoundException('Registration not found');
    }
    return plainToInstance(RegistrationDetailsDto, updated.toObject());

  }

  async addDocument(registrationId: string, document: RegistrationDocumentFileDetails) {
    const updatedRecord = await this.registrationModel.findOneAndUpdate(
      { registrationId: registrationId },
      { $push: { documents: document } },
      { new: true }
    ).lean().exec();
    if (!updatedRecord) {
      throw new NotFoundException('Registration not found');
    }
    this.logger.debug({updatedRecord})
    return plainToInstance(RegistrationDetailsDto, updatedRecord);
  }

  async registrationForWalletAddressExists(accountWalletAddress: string) {
    return (await this.registrationModel.exists({ accountWalletAddress })) !== null;
  }
}