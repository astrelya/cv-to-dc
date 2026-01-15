import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import {
  DocumentGenerationService,
  DocumentGenerationOptions,
} from './document-generation.service';
import { CvService } from '../cv/cv.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiProperty,
} from '@nestjs/swagger';

export class GenerateDocumentDto {
  @ApiProperty({
    description: 'Name of the Word template file',
    example: 'cv-template.docx',
  })
  @IsString()
  @IsNotEmpty()
  templateName: string;

  @ApiProperty({
    description: 'ID of the processed CV to use as data source',
    example: 'ckm123abc456def789',
  })
  @IsString()
  @IsNotEmpty()
  cvId: string;

  @ApiProperty({
    description: 'Optional custom name for the generated document',
    example: 'John_Doe_CV',
    required: false,
  })
  @IsString()
  @IsOptional()
  outputName?: string;
}

export class CustomGenerateDocumentDto {
  @ApiProperty({
    description: 'Name of the Word template file',
    example: 'custom-template.docx',
  })
  @IsString()
  @IsNotEmpty()
  templateName: string;

  @ApiProperty({
    description: 'Data to fill into the template',
    example: {
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      summary: 'Experienced software developer...',
      skills: ['JavaScript', 'TypeScript', 'Node.js'],
    },
  })
  @IsObject()
  @IsNotEmpty()
  data: any;

  @ApiProperty({
    description: 'Optional custom name for the generated document',
    example: 'Custom_Document',
    required: false,
  })
  @IsString()
  @IsOptional()
  outputName?: string;
}

@ApiTags('Document Generation')
@Controller('documents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class DocumentGenerationController {
  constructor(
    private readonly documentService: DocumentGenerationService,
    private readonly cvService: CvService
  ) {}

  @Post('generate-from-cv')
  @ApiOperation({
    summary: 'Generate Word document from CV data',
    description:
      'Generate a Word document using a template and data from a processed CV',
  })
  @ApiBody({
    type: GenerateDocumentDto,
    description: 'Document generation parameters',
  })
  @ApiResponse({
    status: 200,
    description: 'Word document generated successfully',
    headers: {
      'Content-Type': {
        description:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
      'Content-Disposition': {
        description: 'attachment; filename="generated-document.docx"',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid template or CV not found',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateDocumentFromCV(
    @Body() generateDto: GenerateDocumentDto,
    @Request() req: any,
    @Res() res: Response
  ) {
    console.log(
      '🔄 Document Generation Controller: generateDocumentFromCV called'
    );
    console.log('📊 Request body:', generateDto);
    console.log('👤 User from JWT:', req.user);

    const userId = req.user.id;
    const { templateName, cvId, outputName } = generateDto;

    console.log('📋 Extracted parameters:', {
      userId,
      templateName,
      cvId,
      outputName,
    });

    try {
      console.log('🔍 Fetching CV by ID...');
      // Get the CV data
      const cv = await this.cvService.findCVById(cvId, userId);
      console.log('✅ CV found:', {
        id: cv.id,
        title: cv.title,
        status: cv.status,
        hasOcrData: !!cv.ocrData,
        ocrDataKeys: cv.ocrData ? Object.keys(cv.ocrData) : [],
      });

      if (!cv.ocrData) {
        console.error('❌ CV has no OCR data');
        throw new BadRequestException(
          'CV has no processed data available for document generation'
        );
      }

      // Determine schema type and convert data
      console.log('🔄 Determining schema type...');
      console.log(
        '🔍 CV OCR Data structure:',
        JSON.stringify(cv.ocrData, null, 2).substring(0, 500) + '...'
      );

      // Check if it's custom schema (has name, headline, years_experience)
      const isCustomSchema =
        cv.ocrData &&
        typeof cv.ocrData === 'object' &&
        'name' in cv.ocrData &&
        'headline' in cv.ocrData &&
        'years_experience' in cv.ocrData;

      const schemaType = isCustomSchema ? 'custom' : 'legacy';
      console.log(
        '📊 Schema type determined:',
        schemaType,
        '(isCustomSchema:',
        isCustomSchema,
        ')'
      );

      console.log('🔄 Converting CV data to template format...');
      const templateData = this.documentService.convertCVDataToTemplate(
        cv.ocrData,
        schemaType
      );
      console.log('✅ Template data converted:', {
        hasFullName: !!templateData.fullName,
        hasEmail: !!templateData.email,
        experienceCount: templateData.experience?.length || 0,
        skillsKeys: templateData.skills ? Object.keys(templateData.skills) : [],
      });

      console.log('📄 Generating document with template:', templateName);
      // Generate document
      const documentBuffer = await this.documentService.generateDocument({
        templateName,
        data: templateData,
        outputName,
      });
      console.log(
        '✅ Document generated successfully, size:',
        documentBuffer.length,
        'bytes'
      );

      // Set response headers
      const filename =
        outputName || `CV_${cv.title.replace(/\s+/g, '_')}_${Date.now()}`;
      const sanitizedFilename = filename.replace(/[^\w\-_]/g, '') + '.docx';
      console.log('📁 Final filename:', sanitizedFilename);

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${sanitizedFilename}"`
      );
      res.setHeader('Content-Length', documentBuffer.length);

      console.log('📤 Sending document response...');
      // Send the document
      res.end(documentBuffer);
    } catch (error) {
      console.error('❌ Error in generateDocumentFromCV:', error);
      console.error('📊 Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });

      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to generate document: ${error.message}`
      );
    }
  }

  @Post('generate-custom')
  @ApiOperation({
    summary: 'Generate Word document from custom data',
    description:
      'Generate a Word document using a template and custom data input',
  })
  @ApiBody({
    type: CustomGenerateDocumentDto,
    description: 'Custom document generation parameters',
  })
  @ApiResponse({
    status: 200,
    description: 'Word document generated successfully',
    headers: {
      'Content-Type': {
        description:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
    },
  })
  async generateCustomDocument(
    @Body() generateDto: CustomGenerateDocumentDto,
    @Res() res: Response
  ) {
    const { templateName, data, outputName } = generateDto;

    try {
      // Generate document with custom data
      const documentBuffer = await this.documentService.generateDocument({
        templateName,
        data,
        outputName,
      });

      // Set response headers
      const filename = outputName || `Custom_Document_${Date.now()}`;
      const sanitizedFilename = filename.replace(/[^\w\-_]/g, '') + '.docx';

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${sanitizedFilename}"`
      );
      res.setHeader('Content-Length', documentBuffer.length);

      // Send the document
      res.end(documentBuffer);
    } catch (error) {
      throw new BadRequestException(
        `Failed to generate document: ${error.message}`
      );
    }
  }

  @Get('templates')
  @ApiOperation({
    summary: 'List available templates',
    description: 'Get a list of all available Word templates',
  })
  @ApiResponse({
    status: 200,
    description: 'List of available templates',
    schema: {
      type: 'object',
      properties: {
        templates: {
          type: 'array',
          items: { type: 'string' },
          example: ['cv-template.docx', 'cover-letter-template.docx'],
        },
      },
    },
  })
  async getAvailableTemplates() {
    const templates = this.documentService.getAvailableTemplates();
    return { templates };
  }

  @Post('templates/sample')
  @ApiOperation({
    summary: 'Create sample template',
    description: 'Create a sample Word template for demonstration purposes',
  })
  @ApiResponse({
    status: 200,
    description: 'Sample template creation initiated',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        templatePath: { type: 'string' },
      },
    },
  })
  async createSampleTemplate() {
    await this.documentService.createSampleTemplate();
    return {
      message:
        'Sample template creation initiated. Please create a Word template with placeholders.',
      templatePath: 'apps/cv-converter-api/templates/cv-template.docx',
      instructions: [
        '1. Create a new Word document',
        '2. Add placeholders like {fullName}, {email}, {summary}',
        '3. Save as cv-template.docx in the templates folder',
        '4. See the full list of available placeholders in the API documentation',
      ],
    };
  }
}
