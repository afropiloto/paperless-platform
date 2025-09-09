import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Registration, RegistrationDocumentDetails } from './schemas/registration.schema';
import { plainToInstance } from 'class-transformer';
import { RegistrationDetailsDto } from './dtos/registration-details.dto';
import { CreateRegistrationDto } from './dtos/create-registration.dto';
import { RegistrationDocumentFileDetails } from './models/registration-document-file-details';
import { ObjectId } from 'mongodb';

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

    return plainToInstance(RegistrationDetailsDto, updatedRecord);
  }

  async registrationForWalletAddressExists(accountWalletAddress: string) {
    return (await this.registrationModel.exists({ accountWalletAddress })) !== null;
  }

  async getFileDetailsById(registrationId: string, fileId: string) {
    const registrationDetails =  await this.findByRegistrationId(registrationId);

    const registrationFileDetails = registrationDetails.documents.filter((document) => document._id.toString() === fileId);

    if (registrationFileDetails.length !== 1) {throw new NotFoundException('Registration File not found');}
    return registrationFileDetails ? plainToInstance(RegistrationDocumentDetails, registrationFileDetails[0]) : null
  }

  async findByCompanyName(companyName: string, options?: { excludeStatuses?: string[] }): Promise<RegistrationDetailsDto[]> {
    const query: any = { 'company.name': { $regex: new RegExp(companyName, 'i') } };
    
    if (options?.excludeStatuses && options.excludeStatuses.length > 0) {
      query.status = { $nin: options.excludeStatuses };
    }

    const registrations = await this.registrationModel.find(query).lean().exec();
    return registrations.map(registration => 
      plainToInstance(RegistrationDetailsDto, registration)
    );
  }

  async findByWalletAddress(walletAddress: string, options?: { excludeStatuses?: string[] }): Promise<RegistrationDetailsDto[]> {
    const query: any = { 'company.accountWalletAddress': walletAddress };
    
    if (options?.excludeStatuses && options.excludeStatuses.length > 0) {
      query.status = { $nin: options.excludeStatuses };
    }

    const registrations = await this.registrationModel.find(query).lean().exec();
    return registrations.map(registration => 
      plainToInstance(RegistrationDetailsDto, registration)
    );
  }

}