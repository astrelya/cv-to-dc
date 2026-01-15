import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'User information',
    type: 'object',
    properties: {
      id: { type: 'string', example: 'ckm123abc456def789' },
      email: { type: 'string', example: 'john.doe@example.com' },
      name: { type: 'string', example: 'John Doe' },
    },
  })
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}
