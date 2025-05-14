import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class DidVerificationMethod {
  @Expose()
  type: string;
  id: string;
  controller: string;
  publicKeyBase58: string;
}

export class DidDto {
  @Expose()
  id: string;
  @Expose()
  verificationMethod: DidVerificationMethod[]
  @Expose({name: '@context'})
  context: string[];
  @Expose()
  authentication: string[];
  @Expose()
  assertionMethod: string[];
  @Expose()
  capabilityInvocation: string[];
  @Expose()
  capabilityDelegation: string[];
}
