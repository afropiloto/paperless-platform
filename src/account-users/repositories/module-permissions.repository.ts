import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { plainToInstance } from 'class-transformer';
import { ModulePermissions, ModulePermissionsDocument } from '../schemas/module-permissions.schema';
import { CreateOrUpdateModulePermissionsDto, ModulePermissionsDto } from '../dtos/module-permissions.dto';

@Injectable()
export class ModulePermissionsRepository {
  private readonly logger = new Logger(ModulePermissionsRepository.name);

  constructor(
    @InjectModel(ModulePermissions.name) private readonly modulePermissionsModel: Model<ModulePermissionsDocument>,
  ) {}

  async upsert(dto: CreateOrUpdateModulePermissionsDto): Promise<ModulePermissionsDto> {
    const update = {
      description: dto.description,
      allowableRoles: dto.allowableRoles,
      active: dto.active,
    };

    const doc = await this.modulePermissionsModel.findOneAndUpdate(
      { module: dto.module },
      { $set: update, $setOnInsert: { module: dto.module } },
      { new: true, upsert: true }
    );

    return plainToInstance(ModulePermissionsDto, doc.toObject(), { excludeExtraneousValues: true });
  }

  async findByModule(module: string): Promise<ModulePermissionsDto | null> {
    const doc = await this.modulePermissionsModel.findOne({ module });
    if (!doc) return null;
    return plainToInstance(ModulePermissionsDto, doc.toObject(), { excludeExtraneousValues: true });
  }

  async findAllActive(): Promise<ModulePermissionsDto[]> {
    const docs = await this.modulePermissionsModel.find({ active: true });
    return docs.map(d => plainToInstance(ModulePermissionsDto, d.toObject(), { excludeExtraneousValues: true }));
  }

  async findAll(): Promise<ModulePermissionsDto[]> {
    const docs = await this.modulePermissionsModel.find();
    return docs.map(d => plainToInstance(ModulePermissionsDto, d.toObject(), { excludeExtraneousValues: true }));
  }
}


