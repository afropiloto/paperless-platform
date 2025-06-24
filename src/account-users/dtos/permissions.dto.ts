import { Expose } from 'class-transformer';
import { IsBoolean, IsString } from 'class-validator';

export class ModulesDto {
  @Expose()
  @IsString()
  id: string;

  @Expose()
  @IsString()
  name: string;

  @Expose()
  @IsString()
  description: string;

  @Expose()
  @IsBoolean()
  active: boolean;
}

export class RolesDto {
  @Expose()
  @IsString()
  id: string;

  @Expose()
  @IsString()
  name: string;

  @Expose()
  @IsString()
  description: string;

  @Expose()
  @IsBoolean()
  active: boolean;
}

export class ModuleRoleCombinationDto {
  @Expose()
  @IsString()
  module: string;

  @Expose()
  @IsString()
  role: string;
}