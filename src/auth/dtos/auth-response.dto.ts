import { Expose } from 'class-transformer';


export class AuthResponseDto {
  @Expose()
  success: boolean;
  @Expose()
  accessToken: string;
  @Expose()
  refreshToken: string;
  @Expose()
  accountId: string;
  @Expose()
  accountName: string;
  @Expose()
  accountEmail: string;

}