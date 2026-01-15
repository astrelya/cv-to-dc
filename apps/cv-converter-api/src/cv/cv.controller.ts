import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CvService } from './cv.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('CV Management')
@Controller('cv')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CvController {
  constructor(private readonly cvService: CvService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload and process CV',
    description:
      'Upload a CV file (PDF or image) and extract structured data using AI. PDFs use a detailed technical schema while images use a general schema.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'CV file and metadata',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CV file (PDF, JPEG, PNG, GIF, WebP)',
        },
        title: {
          type: 'string',
          description: 'Title for the CV',
          example: 'John Doe - Senior Developer',
        },
        extractImages: {
          type: 'string',
          description: 'Whether to extract images from CV (true/false)',
          example: 'true',
        },
        enhancedParsing: {
          type: 'string',
          description: 'Whether to use enhanced parsing (true/false)',
          example: 'true',
        },
      },
      required: ['file', 'title'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'CV uploaded and processed successfully',
    schema: {
      type: 'object',
      properties: {
        cv: {
          type: 'object',
          description: 'CV database record',
        },
        ocrData: {
          type: 'object',
          description: 'Extracted CV data (structure depends on file type)',
        },
        schemaType: {
          type: 'string',
          enum: ['legacy', 'custom'],
          description: 'Schema type used for data extraction',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid file type or size',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async uploadCV(
    @UploadedFile() file: any,
    @Body('title') title: string,
    @Request() req: any,
    @Body('extractImages') extractImages?: string,
    @Body('enhancedParsing') enhancedParsing?: string
  ) {
    const userId = req.user.id; // Changed from req.user.userId to req.user.id
    const shouldExtractImages = extractImages === 'true';
    const shouldEnhanceParsing = enhancedParsing === 'true';

    return this.cvService.uploadAndProcessCV(
      file,
      title,
      userId,
      shouldExtractImages,
      shouldEnhanceParsing
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get user CVs',
    description: 'Retrieve all CVs uploaded by the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'List of user CVs',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        description: 'CV record with user information',
      },
    },
  })
  async getUserCVs(@Request() req: any) {
    const userId = req.user.id;
    return this.cvService.findAllUserCVs(userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get CV by ID',
    description:
      'Retrieve a specific CV by its ID (only accessible by the owner)',
  })
  @ApiParam({
    name: 'id',
    description: 'CV ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'CV details with extracted data',
  })
  @ApiResponse({
    status: 404,
    description: 'CV not found',
  })
  async getCVById(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.id;
    return this.cvService.findCVById(id, userId);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete CV',
    description:
      'Delete a specific CV by its ID (only accessible by the owner)',
  })
  @ApiParam({
    name: 'id',
    description: 'CV ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'CV deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'CV not found',
  })
  async deleteCVById(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.id;
    await this.cvService.deleteCVById(id, userId);
    return { message: 'CV deleted successfully' };
  }
}
