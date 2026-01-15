import { ApiProperty } from '@nestjs/swagger';

export enum CVStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export class CvResponseDto {
  @ApiProperty({
    description: 'Unique CV identifier',
    example: 'ckm123abc456def789',
  })
  id: string;

  @ApiProperty({
    description: 'CV title or name',
    example: 'Software Engineer Resume',
  })
  title: string;

  @ApiProperty({
    description: 'URL to the original CV file',
    example: 'https://example.com/original-cv.pdf',
    nullable: true,
  })
  originalUrl: string | null;

  @ApiProperty({
    description: 'URL to the converted CV file',
    example: 'https://example.com/converted-cv.pdf',
    nullable: true,
  })
  convertedUrl: string | null;

  @ApiProperty({
    description: 'CV conversion status',
    enum: CVStatus,
    example: CVStatus.COMPLETED,
  })
  status: CVStatus;

  @ApiProperty({
    description: 'CV creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'CV last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'User ID who owns this CV',
    example: 'ckm123abc456def789',
  })
  userId: string;
}
