import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

// Use require for better compatibility
const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');

export interface DocumentGenerationOptions {
  templateName: string;
  data: any;
  outputName?: string;
}

export interface CVTemplateData {
  // Personal Information
  fullName: string;
  email: string;
  phone: string;
  address: string;
  linkedin?: string;
  github?: string;
  website?: string;

  // Professional Details
  headline?: string;
  years_experience?: string;
  summary: string;

  // Experience
  experience: Array<{
    title: string;
    company: string;
    location?: string;
    start_date: string;
    end_date: string;
    description: string;
    technologies?: string[];
    responsibilities?: string[];
    achievements?: string[];
  }>;

  // Education
  education: Array<{
    degree: string;
    field?: string;
    institution: string;
    start_date?: string;
    end_date?: string;
    year?: string;
    location?: string;
    gpa?: string;
    honors?: string[];
  }>;

  // Skills
  skills: {
    technical?: string[];
    languages?: string[];
    soft?: string[];
    tools?: string[];
    cloud?: any[];
    platforms_os?: string[];
    containers?: string[];
    orchestration?: string[];
    iac?: string[];
    ci_cd?: any[];
    version_control?: string[];
    monitoring_logging?: string[];
    databases_cache?: string[];
    search?: string[];
    security?: string[];
    scripting?: string[];
    other_tools?: string[];
  };

  // Additional sections
  certifications?: Array<{
    name: string;
    issuer: string;
    date: string;
    expiryDate?: string;
  }>;

  projects?: Array<{
    name: string;
    role?: string;
    organization?: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    duration?: string;
    highlights?: string[];
    tech_stack?: string[];
    technologies?: string[];
    link?: string;
  }>;

  languages?: Array<{
    language: string;
    proficiency: string;
  }>;

  awards?:
    | Array<{
        name: string;
        issuer: string;
        year: string;
        description?: string;
      }>
    | string[];

  affiliations?: string[];

  // Meta information
  generatedDate?: string;
  notes?: string;
}

@Injectable()
export class DocumentGenerationService {
  private readonly logger = new Logger(DocumentGenerationService.name);
  private readonly templatesPath = this.getTemplatesPath();

  private getTemplatesPath(): string {
    // In production (PM2), working directory is already at the deployed location
    const prodPath = path.join(process.cwd(), 'templates');

    // In development, templates are in the source structure
    const devPath = path.join(
      process.cwd(),
      'apps',
      'cv-converter-api',
      'templates'
    );

    // Check which path exists
    if (fs.existsSync(prodPath)) {
      console.log(`📁 Using production templates path: ${prodPath}`);
      return prodPath;
    } else if (fs.existsSync(devPath)) {
      console.log(`📁 Using development templates path: ${devPath}`);
      return devPath;
    } else {
      // Fallback to production path and let it be created if needed
      console.log(`📁 Using fallback templates path: ${prodPath}`);
      return prodPath;
    }
  }

  constructor() {
    // Ensure templates directory exists
    if (!fs.existsSync(this.templatesPath)) {
      fs.mkdirSync(this.templatesPath, { recursive: true });
      this.logger.log(`Created templates directory at: ${this.templatesPath}`);
    }
  }

  async generateDocument(options: DocumentGenerationOptions): Promise<Buffer> {
    const { templateName, data, outputName } = options;

    this.logger.log('🔄 DocumentGenerationService: generateDocument called');
    this.logger.log(
      `📊 Options: templateName=${templateName}, outputName=${outputName}`
    );
    this.logger.log(`📊 Data keys: ${Object.keys(data || {})}`);
    this.logger.log(`📁 Templates path: ${this.templatesPath}`);

    try {
      // Load template
      const templatePath = path.join(this.templatesPath, templateName);
      this.logger.log(`🔍 Looking for template at: ${templatePath}`);

      // Check if templates directory exists
      if (!fs.existsSync(this.templatesPath)) {
        this.logger.error(
          `❌ Templates directory does not exist: ${this.templatesPath}`
        );
        throw new BadRequestException(
          `Templates directory not found: ${this.templatesPath}`
        );
      }

      // List files in templates directory
      const templateFiles = fs.readdirSync(this.templatesPath);
      this.logger.log(
        `📂 Files in templates directory: ${templateFiles.join(', ')}`
      );

      if (!fs.existsSync(templatePath)) {
        this.logger.error(`❌ Template file not found: ${templatePath}`);
        throw new BadRequestException(
          `Template not found: ${templateName}. Available templates: ${templateFiles.join(
            ', '
          )}`
        );
      }

      this.logger.log(`✅ Loading template: ${templatePath}`);

      // Read template file
      const content = fs.readFileSync(templatePath, 'binary');
      this.logger.log(`📄 Template file size: ${content.length} bytes`);

      // Create PizZip instance
      this.logger.log('🔄 Creating PizZip instance...');
      const zip = new PizZip(content);

      // Create document templater
      this.logger.log('🔄 Creating Docxtemplater instance...');
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      // Set the template data and render
      this.logger.log('🔄 Setting template data and rendering...');
      this.logger.log(
        `📊 Template data sample: ${JSON.stringify({
          fullName: data.fullName,
          email: data.email,
          experienceCount: data.experience?.length,
          skillsKeys: data.skills ? Object.keys(data.skills) : [],
        })}`
      );

      try {
        this.logger.log('🔄 Rendering document...');
        // Render the document with data (new API)
        doc.render(data);
        this.logger.log('✅ Document rendered successfully');
      } catch (error) {
        this.logger.error('❌ Error rendering template:', error);
        this.logger.error('❌ Error details:', {
          name: error.name,
          message: error.message,
          properties: error.properties || 'No properties available',
        });

        // Handle specific template errors
        if (error.name === 'TemplateError' || error.name === 'RenderingError') {
          throw new BadRequestException(
            `Template error: ${error.message}. Please check your template syntax and data structure.`
          );
        }

        if (error.name === 'ScopeParserError') {
          throw new BadRequestException(
            `Template parsing error: ${error.message}. Check template placeholder syntax.`
          );
        }

        throw new BadRequestException(
          `Failed to render document: ${
            error.message || 'Unknown rendering error'
          }`
        );
      }

      this.logger.log('🔄 Generating document buffer...');
      // Generate the document buffer
      const buffer = doc.getZip().generate({
        type: 'nodebuffer',
        // Compression
        compression: 'DEFLATE',
        compressionOptions: {
          level: 9,
        },
      });

      this.logger.log(
        `✅ Document generated successfully. Size: ${buffer.length} bytes`
      );

      return buffer;
    } catch (error) {
      this.logger.error(
        `Error generating document with template ${templateName}:`,
        error
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        `Failed to generate document: ${error.message}`
      );
    }
  }

  // Convert CV OCR data to template format
  convertCVDataToTemplate(
    ocrData: any,
    schemaType: 'legacy' | 'custom'
  ): CVTemplateData {
    this.logger.log(
      `🔄 Converting CV data to template format (schema: ${schemaType})`
    );
    this.logger.log(`📊 Input data keys: ${Object.keys(ocrData || {})}`);

    try {
      let result: CVTemplateData;

      if (schemaType === 'custom') {
        this.logger.log('🔄 Using custom schema conversion...');
        result = this.convertCustomSchemaToTemplate(ocrData);
      } else {
        this.logger.log('🔄 Using legacy schema conversion...');
        result = this.convertLegacySchemaToTemplate(ocrData);
      }

      this.logger.log('✅ CV data conversion completed');
      this.logger.log(
        `📊 Result summary: fullName="${result.fullName}", email="${
          result.email
        }", experienceCount=${result.experience?.length || 0}`
      );

      return result;
    } catch (error) {
      this.logger.error(
        '❌ Error converting CV data to template format:',
        error
      );
      throw new BadRequestException(
        `Failed to convert CV data: ${error.message}`
      );
    }
  }

  private convertCustomSchemaToTemplate(data: any): CVTemplateData {
    this.logger.log('🔄 Processing custom schema data...');

    if (!data) {
      this.logger.warn('⚠️ No data provided for custom schema conversion');
      throw new BadRequestException('No CV data provided');
    }

    const result = {
      // Personal Information
      fullName: data.name || data.fullName || '',
      email: data.contact?.email || data.email || '',
      phone: data.contact?.phone || data.phone || '',
      address: data.contact?.location || data.address || data.location || '',
      linkedin: data.contact?.links?.linkedin || data.linkedin || '',
      github: data.contact?.links?.github || data.github || '',
      website: data.contact?.links?.website || data.website || '',

      // Professional Details
      headline: data.headline || '',
      years_experience: data.years_experience || '',
      summary: data.summary || '',

      // Experience - Handle both array and non-array cases
      experience: Array.isArray(data.experience)
        ? data.experience.map((exp: any) => ({
            title: exp.title || '',
            company: exp.company || '',
            location: exp.location || '',
            start_date: exp.start_date || '',
            end_date: exp.end_date || '',
            description: exp.description || '',
            technologies: Array.isArray(exp.technologies)
              ? exp.technologies
              : [],
          }))
        : [],

      // Education
      education: (data.education || []).map((edu: any) => ({
        degree: edu.degree || '',
        field: edu.field || '',
        institution: edu.institution || '',
        start_date: edu.start_date || '',
        end_date: edu.end_date || '',
      })),

      // Skills - Custom schema has categorized skills
      skills: {
        cloud: this.withFlags(data.skills?.cloud) || [],
        platforms_os: data.skills?.platforms_os || [],
        containers: data.skills?.containers || [],
        orchestration: data.skills?.orchestration || [],
        iac: data.skills?.iac || [],
        //ci_cd: this.withFlags(data.skills?.ci_cd) || [],
        ci_cd: data.skills.ci_cd?.length ? [{}] : [],
        version_control: data.skills?.version_control || [],
        monitoring_logging: data.skills?.monitoring_logging || [],
        databases_cache: data.skills?.databases_cache || [],
        search: data.skills?.search || [],
        security: data.skills?.security || [],
        scripting: data.skills?.scripting || [],
        other_tools: data.skills?.other_tools || [],
      },

      // Additional sections
      certifications: data.certifications || [],
      projects: data.projects || [],
      languages: data.languages || [],
      awards: data.awards || [],
      affiliations: data.affiliations || [],

      // Meta
      generatedDate: new Date().toLocaleDateString(),
      notes: data.notes || '',
    };

    this.logger.log(
      `✅ Custom schema conversion completed for: ${result.fullName}`
    );
    return result;
  }

  private convertLegacySchemaToTemplate(data: any): CVTemplateData {
    return {
      // Personal Information
      fullName: data.personalInfo?.fullName || '',
      email: data.personalInfo?.email || '',
      phone: data.personalInfo?.phone || '',
      address: data.personalInfo?.address || '',
      linkedin: data.personalInfo?.linkedin || '',
      github: data.personalInfo?.github || '',
      website: data.personalInfo?.website || '',

      // Professional Details
      summary: data.professionalSummary || data.extractedText || '',

      // Experience
      experience: (data.workExperience || []).map((exp: any) => ({
        title: exp.jobTitle || '',
        company: exp.company || '',
        location: exp.location || '',
        start_date: '',
        end_date: '',
        description: exp.duration || '',
        responsibilities: exp.responsibilities || [],
        achievements: exp.achievements || [],
      })),

      // Education
      education: (data.education || []).map((edu: any) => ({
        degree: edu.degree || '',
        institution: edu.institution || '',
        year: edu.year || '',
        location: edu.location || '',
        gpa: edu.gpa || '',
        honors: edu.honors || [],
      })),

      // Skills - Legacy schema has basic categorization
      skills: {
        technical: data.skills?.technical || [],
        languages: data.skills?.languages || [],
        soft: data.skills?.soft || [],
        tools: data.skills?.tools || [],
      },

      // Additional sections
      certifications: data.certifications || [],
      projects: data.projects || [],
      languages: data.languages || [],
      awards: data.awards || [],

      // Meta
      generatedDate: new Date().toLocaleDateString(),
    };
  }

  // List available templates
  getAvailableTemplates(): string[] {
    try {
      const files = fs.readdirSync(this.templatesPath);
      return files.filter((file) => file.endsWith('.docx'));
    } catch (error) {
      this.logger.error('Error reading templates directory:', error);
      return [];
    }
  }

  // Create a sample template (for demonstration)
  async createSampleTemplate(): Promise<void> {
    const sampleTemplatePath = path.join(
      this.templatesPath,
      'cv-template.docx'
    );

    if (fs.existsSync(sampleTemplatePath)) {
      this.logger.log('Sample template already exists');
      return;
    }

    // Note: In a real implementation, you would have a pre-made .docx template file
    this.logger.log(`Please create a Word template at: ${sampleTemplatePath}`);
    this.logger.log(
      'Template should include placeholders like: {fullName}, {email}, {summary}, etc.'
    );
  }

  private withFlags(arr: string[]) {
    return arr.map((label, i, a) => ({
      label,
      isFirst: i === 0,
      isLast: i === a.length - 1,
    }));
  }
}
