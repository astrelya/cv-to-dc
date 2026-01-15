import { ApiProperty } from '@nestjs/swagger';

export class CreateCvDto {
  @ApiProperty({
    description: 'CV title or name',
    example: 'Software Engineer Resume',
  })
  title: string;

  @ApiProperty({
    description: 'URL to the original CV file',
    example: 'https://example.com/original-cv.pdf',
    required: false,
  })
  originalUrl?: string;

  @ApiProperty({
    description: 'User ID who owns this CV',
    example: 'ckm123abc456def789',
  })
  userId: string;
}
