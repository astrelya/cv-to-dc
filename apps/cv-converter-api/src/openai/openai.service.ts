import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PDF_PROCESSING_PROMPT } from './prompts/pdf-processing.prompt';
import { IMAGE_PROCESSING_PROMPT } from './prompts/image-processing.prompt';

// New custom schema interface
export interface CustomCVResult {
  name: string;
  headline: string;
  years_experience: string;
  contact: {
    email: string;
    phone: string;
    location: string;
    links: {
      linkedin: string;
      github: string;
      website: string;
    };
  };
  summary: string;
  experience: Array<{
    title: string;
    company: string;
    location: string;
    start_date: string;
    end_date: string;
    description: string;
    technologies: string[];
  }>;
  education: Array<{
    degree: string;
    field: string;
    institution: string;
    start_date: string;
    end_date: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
  skills: {
    cloud: string[];
    platforms_os: string[];
    containers: string[];
    orchestration: string[];
    iac: string[];
    ci_cd: string[];
    version_control: string[];
    monitoring_logging: string[];
    databases_cache: string[];
    search: string[];
    security: string[];
    scripting: string[];
    other_tools: string[];
  };
  languages: Array<{
    language: string;
    proficiency: string;
  }>;
  projects: Array<{
    name: string;
    role: string;
    organization: string;
    start_date: string;
    end_date: string;
    highlights: string[];
    tech_stack: string[];
  }>;
  affiliations: string[];
  awards: string[];
  notes: string;
}

// Legacy schema interface (keeping for backward compatibility)
export interface CVOCRResult {
  personalInfo: {
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  professionalSummary?: string;
  workExperience: Array<{
    jobTitle: string;
    company: string;
    duration: string;
    location?: string;
    responsibilities: string[];
    achievements?: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
    location?: string;
    gpa?: string;
    honors?: string[];
  }>;
  skills: {
    technical: string[];
    languages: string[];
    soft: string[];
    tools: string[];
  };
  certifications: Array<{
    name: string;
    issuer: string;
    year: string;
    expiryDate?: string;
  }>;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    duration?: string;
    link?: string;
  }>;
  languages: Array<{
    language: string;
    proficiency: string;
  }>;
  awards?: Array<{
    name: string;
    issuer: string;
    year: string;
    description?: string;
  }>;
  publications?: Array<{
    title: string;
    journal: string;
    year: string;
    authors: string[];
  }>;
  references?: Array<{
    name: string;
    title: string;
    company: string;
    email?: string;
    phone?: string;
  }>;
  extractedText: string;
  confidence: number;
  processingNotes: string[];
}

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not found in environment variables');
      return;
    }

    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  async processCV(
    fileBuffer: Buffer,
    mimeType: string
  ): Promise<CVOCRResult | CustomCVResult> {
    if (!this.openai) {
      throw new Error(
        'OpenAI API key not configured. Please add your OpenAI API key to the environment variables to enable CV processing.'
      );
    }

    try {
      // Check if the file is a PDF
      if (mimeType === 'application/pdf') {
        return await this.processPDF(fileBuffer);
      } else {
        // Handle image files with the legacy schema
        return await this.processImageCV(fileBuffer, mimeType);
      }
    } catch (error) {
      this.logger.error('Error processing CV with OpenAI:', error);

      // Handle specific OpenAI API errors with user-friendly messages
      if (error.status === 429) {
        throw new Error(
          'OpenAI API quota exceeded. Please check your OpenAI billing and add credits to continue processing CVs. Visit https://platform.openai.com/billing to manage your account.'
        );
      }

      if (error.code === 'insufficient_quota') {
        throw new Error(
          'Insufficient OpenAI API quota. Please add credits to your OpenAI account at https://platform.openai.com/billing to enable CV processing.'
        );
      }

      if (error.status === 401) {
        throw new Error(
          'Invalid OpenAI API key. Please check your API key configuration and ensure it is valid.'
        );
      }

      if (error.status === 403) {
        throw new Error(
          'OpenAI API access forbidden. Please verify your API key has the necessary permissions for GPT-4 Vision model.'
        );
      }

      if (error.status >= 500) {
        throw new Error(
          'OpenAI service is currently unavailable. Please try again in a few minutes.'
        );
      }

      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new Error(
          'Unable to connect to OpenAI API. Please check your internet connection and try again.'
        );
      }

      // Generic error for any other issues
      throw new Error(
        `CV processing failed: ${
          error.message || 'Unknown error occurred. Please try again.'
        }`
      );
    }
  }

  private async processPDF(fileBuffer: Buffer): Promise<CustomCVResult> {
    try {
      // Dynamic import for pdf-parse to avoid constructor issues
      let pdfData: any;
      try {
        const pdfParseModule = await import('pdf-parse');
        const pdfParseFunction =
          typeof pdfParseModule === 'function'
            ? pdfParseModule
            : pdfParseModule.default;
        pdfData = await pdfParseFunction(fileBuffer);
      } catch (pdfError) {
        this.logger.error('PDF parsing failed:', pdfError);
        // Fallback: extract basic info without parsing
        pdfData = {
          text: 'PDF content could not be extracted. Please try with a different PDF file.',
        };
      }

      const extractedText = pdfData.text;

      this.logger.log(`Extracted ${extractedText.length} characters from PDF`);

      // Process the extracted text with OpenAI using the custom schema
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o', // Using mini model for text processing to reduce costs
        messages: [
          {
            role: 'system',
            content: PDF_PROCESSING_PROMPT,
          },
          {
            role: 'user',
            content: `Please analyze this CV text and extract all information in the structured JSON format specified:\n\n${extractedText}`,
          },
        ],
        max_tokens: 4000,
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No response from OpenAI API. Please try again later.');
      }

      // Parse the JSON response
      let cvResult: CustomCVResult;
      try {
        const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
        cvResult = JSON.parse(cleanedContent);
      } catch (parseError) {
        this.logger.error(
          'Failed to parse OpenAI response as JSON:',
          parseError
        );
        // Return a basic structure with the extracted text
        cvResult = {
          name: '',
          headline: '',
          years_experience: '',
          contact: {
            email: '',
            phone: '',
            location: '',
            links: { linkedin: '', github: '', website: '' },
          },
          summary: extractedText.substring(0, 500) + '...',
          experience: [],
          education: [],
          certifications: [],
          skills: {
            cloud: [],
            platforms_os: [],
            containers: [],
            orchestration: [],
            iac: [],
            ci_cd: [],
            version_control: [],
            monitoring_logging: [],
            databases_cache: [],
            search: [],
            security: [],
            scripting: [],
            other_tools: [],
          },
          languages: [],
          projects: [],
          affiliations: [],
          awards: [],
          notes: `Failed to parse structured data. Raw text available in summary. Error: ${parseError.message}`,
        };
      }

      this.logger.log('PDF CV processing completed successfully');
      return cvResult;
    } catch (error) {
      if (error.message.includes('Invalid PDF structure')) {
        throw new Error(
          'Invalid PDF file. Please ensure the file is a valid PDF document.'
        );
      }
      throw error;
    }
  }

  private async processImageCV(
    fileBuffer: Buffer,
    mimeType: string
  ): Promise<CVOCRResult> {
    // Convert buffer to base64
    const base64Image = fileBuffer.toString('base64');

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o', // Use GPT-4 Vision model for images
      messages: [
        {
          role: 'system',
          content: IMAGE_PROCESSING_PROMPT,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please analyze this CV/Resume and extract all information in the structured JSON format specified.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 4000,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI API. Please try again later.');
    }

    // Parse the JSON response
    let ocrResult: CVOCRResult;
    try {
      const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
      ocrResult = JSON.parse(cleanedContent);
    } catch (parseError) {
      this.logger.error('Failed to parse OpenAI response as JSON:', parseError);
      // Fallback response
      ocrResult = {
        personalInfo: {},
        workExperience: [],
        education: [],
        skills: { technical: [], languages: [], soft: [], tools: [] },
        certifications: [],
        projects: [],
        languages: [],
        extractedText: content,
        confidence: 50,
        processingNotes: [
          'Failed to parse structured data, returning raw text',
        ],
      };
    }

    this.logger.log('Image CV processing completed successfully');
    return ocrResult;
  }

  async isConfigured(): Promise<boolean> {
    return !!this.openai;
  }
}
