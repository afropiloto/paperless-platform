import { Expose, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';

export class AllowableRoleDto {
  @Expose()
  @IsString()
  role: string;

  @Expose()
  @IsString()
  @IsOptional()
  description?: string;
}

export class ModulePermissionsDto {
  @Expose()
  @IsString()
  module: string;

  @Expose()
  @IsString()
  @IsOptional()
  description?: string;

  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AllowableRoleDto)
  allowableRoles: AllowableRoleDto[];

  @Expose()
  @IsBoolean()
  active: boolean;
}

export class CreateOrUpdateModulePermissionsDto {
  @IsString()
  module: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AllowableRoleDto)
  allowableRoles: AllowableRoleDto[];

  @IsBoolean()
  active: boolean;
}


