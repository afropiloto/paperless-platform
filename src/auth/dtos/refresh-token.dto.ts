import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({description: 'The Refresh Token provided during login', example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50SWQiOiI2ODYzYWU3YzM3ZDE0NWUxYjEyM2U4OTEiLCJ1c2VySWQiOiI2ODU2YjMxMTY4NDY3MGFhYjMyNjZiOWUiLCJ3YWxsZXRBZGRyZXNzIjoiMHhCMzIwY2YzZTEwRmRENzNmYkNjODFmMjI1QUNiNzFmYUUwMzQyYURmIiwicGVybWlzc2lvbnMiOlt7Im1vZHVsZSI6IkRlYWxEZXNrIiwicm9sZSI6Ik1hbmFnZXIifSx7Im1vZHVsZSI6IlBhaXBlcmxlc3MiLCJyb2xlIjoiTWFuYWdlciJ9XSwiaWF0IjoxNzUyNDkwOTk1LCJleHAiOjE3NTMwOTU3OTV9.BpPMWX05AQB2WxnG_B4iIgZm6jMHobnsutoAU1YLmFg"})
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}