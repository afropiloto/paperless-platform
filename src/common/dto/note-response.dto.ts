import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@Exclude()
export class NoteResponseDto {
  @ApiProperty({
    description: 'The note text',
    example: 'Documentation verified and approved',
  })
  @Expose()
  note: string;

  @ApiProperty({
    description: 'ID of the user who added the note',
    example: 'user123',
  })
  @Expose()
  user: string;

  @ApiProperty({
    description: 'When the note was created',
    example: '2024-03-20T10:00:00Z',
  })
  @Expose()
  createdAt: Date;
}