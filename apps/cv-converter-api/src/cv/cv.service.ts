import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  OpenAIService,
  CVOCRResult,
  CustomCVResult,
} from '../openai/openai.service';
import { CVStatus } from '../../generated/prisma';

@Injectable()
export class CvService {
  private readonly logger = new Logger(CvService.name);

  constructor(
    private prisma: PrismaService,
    private openaiService: OpenAIService
  ) {}

  async uploadAndProcessCV(
    file: any,
    title: string,
    userId: string,
    extractImages?: boolean,
    enhancedParsing?: boolean
  ): Promise<{
    cv: any;
    ocrData: CVOCRResult | CustomCVResult;
    schemaType: 'legacy' | 'custom';
    extractedImages?: any[];
  }> {
    // Validate file type and size
    this.validateFile(file);

    const fileName = file.originalname;
    const fileSize = file.size;
    const mimeType = file.mimetype;

    this.logger.log(
      `Processing CV upload: ${fileName} (${fileSize} bytes, ${mimeType}) for user ${userId}`
    );

    let cvId: string | null = null;

    try {
      // Create initial CV record
      const cv = await this.prisma.cV.create({
        data: {
          title,
          fileName,
          fileSize,
          mimeType,
          userId,
          status: CVStatus.PROCESSING,
          confidence: 0,
          processingNotes: ['Processing started'],
        },
      });

      cvId = cv.id;

      // Process with OpenAI
      const ocrData = await this.openaiService.processCV(file.buffer, mimeType);

      // Determine schema type based on the response structure
      const schemaType = this.determineSchemaType(ocrData);

      // Extract text and confidence based on schema type
      let extractedText = '';
      let confidence = 95;
      let processingNotes: string[] = [];

      if (schemaType === 'legacy') {
        const legacyData = ocrData as CVOCRResult;
        extractedText = legacyData.extractedText || '';
        confidence = legacyData.confidence || 95;
        processingNotes = legacyData.processingNotes || [];
      } else {
        const customData = ocrData as CustomCVResult;
        extractedText = customData.summary || '';
        confidence = 95; // Custom schema doesn't have confidence field
        processingNotes = customData.notes ? [customData.notes] : [];
      }

      // Update CV with OCR results
      const updatedCV = await this.prisma.cV.update({
        where: { id: cv.id },
        data: {
          status: CVStatus.COMPLETED,
          ocrData: ocrData as any,
          extractedText,
          confidence,
          processingNotes,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Save structured data to separate tables
      await this.saveStructuredData(cv.id, ocrData, schemaType);

      this.logger.log(
        `CV processing completed for ${fileName} with ${schemaType} schema and structured data saved`
      );

      return {
        cv: updatedCV,
        ocrData,
        schemaType,
        extractedImages: [], // Placeholder for future image extraction feature
      };
    } catch (error) {
      this.logger.error(`Error processing CV ${fileName}:`, error);

      // Update CV status to failed only if we have a valid CV ID
      if (cvId) {
        try {
          await this.prisma.cV.update({
            where: { id: cvId },
            data: {
              status: CVStatus.FAILED,
              processingNotes: [`Processing failed: ${error.message}`],
            },
          });
        } catch (updateError) {
          this.logger.error(
            `Failed to update CV status for ${cvId}:`,
            updateError
          );
        }
      }

      throw error;
    }
  }

  private validateFile(file: any): void {
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size must be less than 10MB');
    }

    // Check file type - now including PDF
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Please upload an image file (JPEG, PNG, GIF, WebP) or PDF document.'
      );
    }

    this.logger.log(
      `File validation passed: ${file.originalname} (${file.mimetype})`
    );
  }

  private determineSchemaType(
    data: CVOCRResult | CustomCVResult
  ): 'legacy' | 'custom' {
    // Check if it has the custom schema structure
    if ('name' in data && 'headline' in data && 'years_experience' in data) {
      return 'custom';
    }
    // Check if it has the legacy schema structure
    if (
      'personalInfo' in data &&
      'workExperience' in data &&
      'extractedText' in data
    ) {
      return 'legacy';
    }
    // Default to legacy for backward compatibility
    return 'legacy';
  }

  private async saveStructuredData(
    cvId: string,
    data: CVOCRResult | CustomCVResult,
    schemaType: 'legacy' | 'custom'
  ): Promise<void> {
    this.logger.log(
      `🔄 [SAVE_START] Saving structured data for CV ${cvId} with ${schemaType} schema`
    );
    this.logger.log(
      `📊 [SAVE_DATA] OCR Data keys: ${Object.keys(data || {}).join(', ')}`
    );
    this.logger.log(`🆔 [SAVE_ID] CV ID: ${cvId}, Schema Type: ${schemaType}`);

    try {
      this.logger.log(
        `🚀 [SAVE_METHOD] Calling save method for ${schemaType} schema...`
      );

      if (schemaType === 'custom') {
        this.logger.log(
          `📝 [CUSTOM_SCHEMA] Starting custom schema data save...`
        );
        await this.saveCustomSchemaData(cvId, data as CustomCVResult);
        this.logger.log(
          `✅ [CUSTOM_SCHEMA] Custom schema data saved successfully`
        );
      } else {
        this.logger.log(
          `📝 [LEGACY_SCHEMA] Starting legacy schema data save...`
        );
        await this.saveLegacySchemaData(cvId, data as CVOCRResult);
        this.logger.log(
          `✅ [LEGACY_SCHEMA] Legacy schema data saved successfully`
        );
      }

      this.logger.log(
        `✅ [SAVE_SUCCESS] Successfully saved structured data for CV ${cvId}`
      );
    } catch (error) {
      this.logger.error(
        `❌ [SAVE_ERROR] Error saving structured data for CV ${cvId}:`
      );
      this.logger.error(
        `💥 [ERROR_DETAILS] Error name: ${error.constructor.name}`
      );
      this.logger.error(`💬 [ERROR_MESSAGE] Error message: ${error.message}`);
      this.logger.error(`📍 [ERROR_STACK] Error stack: ${error.stack}`);
      this.logger.error(
        `🔍 [ERROR_CONTEXT] Schema type: ${schemaType}, CV ID: ${cvId}`
      );
      this.logger.error(
        `🔧 [ERROR_DATA] Available OCR keys: ${Object.keys(data || {}).join(
          ', '
        )}`
      );

      // Throw the error to see the full stack trace for debugging
      throw error;
    }
  }

  private async saveCustomSchemaData(
    cvId: string,
    data: CustomCVResult
  ): Promise<void> {
    this.logger.log(
      `🎯 [CUSTOM_START] Starting saveCustomSchemaData for CV ${cvId}`
    );
    this.logger.log(
      `📋 [CUSTOM_DATA] Data keys: ${Object.keys(data || {}).join(', ')}`
    );

    try {
      // Save personal information
      this.logger.log(`👤 [PERSONAL_INFO] Processing personal information...`);
      if (data.name || data.headline || data.contact) {
        const [firstName, ...lastNameParts] = (data.name || '').split(' ');
        const lastName = lastNameParts.join(' ');

        this.logger.log(
          `👤 [PERSONAL_INFO] Name: ${data.name}, Email: ${data.contact?.email}`
        );
        this.logger.log(
          `🏠 [LOCATION_RAW] Location data: ${JSON.stringify(
            data.contact?.location,
            null,
            2
          )}`
        );

        this.logger.log(
          `💾 [PERSONAL_INFO] Creating InformationPersonnelle record...`
        );
        // Extract address information properly
        let addressStr = null;
        let postalCode = null;
        let city = null;

        if (data.contact?.location) {
          if (typeof data.contact.location === 'string') {
            addressStr = data.contact.location;
          } else if (typeof data.contact.location === 'object') {
            const loc = data.contact.location as any;
            addressStr = loc.address?.trim() || null;
            postalCode =
              loc.postcode?.trim() || loc.postal_code?.trim() || null;
            city = loc.city?.trim() || null;

            // If no specific address but have city, use city as address
            if (!addressStr && city) {
              addressStr = city;
            }
          }
        }

        const personalInfoData = {
          cvId,
          firstName: firstName || null,
          lastName: lastName || null,
          headline: data.headline?.trim() || null,
          email: data.contact?.email?.trim() || null,
          phone: data.contact?.phone?.trim() || null,
          address: addressStr,
          postalCode: postalCode,
          city: city,
          website: data.contact?.links?.website?.trim() || null,
          linkedin: data.contact?.links?.linkedin?.trim() || null,
          github: data.contact?.links?.github?.trim() || null,
        };

        this.logger.log(
          `💾 [PERSONAL_INFO_DATA] ${JSON.stringify(personalInfoData, null, 2)}`
        );
        await this.prisma.informationPersonnelle.create({
          data: personalInfoData,
        });
        this.logger.log(
          `✅ [PERSONAL_INFO] Personal information saved successfully`
        );
      } else {
        this.logger.log(`⏭️ [PERSONAL_INFO] No personal information to save`);
      }

      // Save profile/summary
      this.logger.log(`📄 [PROFILE] Processing profile/summary...`);
      if (data.summary || data.years_experience) {
        const profilData = {
          cvId,
          summary: data.summary || null,
          yearsOfExperience: data.years_experience || null,
        };

        this.logger.log(
          `💾 [PROFILE_DATA] ${JSON.stringify(profilData, null, 2)}`
        );
        await this.prisma.profil.create({
          data: profilData,
        });
        this.logger.log(`✅ [PROFILE] Profile saved successfully`);
      } else {
        this.logger.log(`⏭️ [PROFILE] No profile/summary to save`);
      }

      // Save professional experiences
      this.logger.log(`💼 [EXPERIENCE] Processing professional experiences...`);
      if (data.experience && data.experience.length > 0) {
        this.logger.log(
          `💼 [EXPERIENCE] Found ${data.experience.length} experiences to save`
        );

        const experiencePromises = data.experience.map((exp, index) => {
          this.logger.log(
            `💼 [EXP_${index}] Processing experience: ${exp.title} at ${exp.company}`
          );

          const { startMonth, startYear, endMonth, endYear, isCurrent } =
            this.parseDate(exp.start_date, exp.end_date);

          this.logger.log(
            `📅 [EXP_${index}_DATES] Start: ${startMonth}/${startYear}, End: ${endMonth}/${endYear}, Current: ${isCurrent}`
          );

          // Validate required fields - title cannot be empty/null
          const title =
            exp.title?.trim() ||
            exp.company?.trim() ||
            `Experience ${index + 1}`;
          if (!exp.title?.trim()) {
            this.logger.warn(
              `⚠️ [EXP_${index}] Missing title, using fallback: "${title}"`
            );
          }

          const experienceData = {
            cvId,
            title: title, // Required field - cannot be empty
            company: exp.company?.trim() || null,
            location: exp.location?.trim() || null,
            startMonth,
            startYear,
            endMonth,
            endYear,
            current: isCurrent,
            description: exp.description?.trim() || null,
            responsibilities: Array.isArray((exp as any).responsibilities)
              ? (exp as any).responsibilities.filter((r) => r?.trim())
              : [],
            achievements: Array.isArray((exp as any).achievements)
              ? (exp as any).achievements.filter((a) => a?.trim())
              : [],
            technologies: Array.isArray(exp.technologies)
              ? exp.technologies.filter((t) => t?.trim())
              : [],
            order: index,
          };

          this.logger.log(
            `💾 [EXP_${index}_DATA] ${JSON.stringify(experienceData, null, 2)}`
          );

          return this.prisma.experienceProfessionnelle.create({
            data: experienceData,
          });
        });

        this.logger.log(
          `⏳ [EXPERIENCE] Saving ${experiencePromises.length} experiences...`
        );
        await Promise.all(experiencePromises);
        this.logger.log(`✅ [EXPERIENCE] All experiences saved successfully`);
      } else {
        this.logger.log(`⏭️ [EXPERIENCE] No professional experiences to save`);
      }

      // Save education/formations
      this.logger.log(`🎓 [EDUCATION] Processing education/formations...`);
      if (data.education && data.education.length > 0) {
        this.logger.log(
          `🎓 [EDUCATION] Found ${data.education.length} education records to save`
        );

        const educationPromises = data.education.map((edu, index) => {
          const { startMonth, startYear, endMonth, endYear, isCurrent } =
            this.parseDate(edu.start_date, edu.end_date);

          // Validate required fields - degree cannot be empty/null
          const degree =
            edu.degree?.trim() || edu.field?.trim() || `Education ${index + 1}`;
          if (!edu.degree?.trim()) {
            this.logger.warn(
              `⚠️ [EDU_${index}] Missing degree, using fallback: "${degree}"`
            );
          }

          const educationData = {
            cvId,
            degree: degree, // Required field - cannot be empty
            institution: edu.institution?.trim() || null,
            startMonth,
            startYear,
            endMonth,
            endYear,
            current: isCurrent,
            finished: !isCurrent,
            description:
              edu.field?.trim() || (edu as any).description?.trim() || null,
            order: index,
            honors: Array.isArray((edu as any).honors)
              ? (edu as any).honors.filter((h) => h?.trim())
              : [],
            activities: Array.isArray((edu as any).activities)
              ? (edu as any).activities.filter((a) => a?.trim())
              : [],
          };

          this.logger.log(
            `💾 [EDU_${index}_DATA] ${JSON.stringify(educationData, null, 2)}`
          );

          return this.prisma.formation.create({
            data: educationData,
          });
        });

        this.logger.log(
          `⏳ [EDUCATION] Saving ${educationPromises.length} education records...`
        );
        await Promise.all(educationPromises);
        this.logger.log(
          `✅ [EDUCATION] All education records saved successfully`
        );
      } else {
        this.logger.log(`⏭️ [EDUCATION] No education records to save`);
      }

      // Save skills/competences
      this.logger.log(`🛠️ [SKILLS] Processing skills/competences...`);
      if (data.skills) {
        const skillsPromises: Promise<any>[] = [];
        let order = 0;

        // Map skills by category
        const skillCategories = [
          { category: 'Cloud', skills: data.skills.cloud || [] },
          {
            category: 'Platforms & OS',
            skills: data.skills.platforms_os || [],
          },
          { category: 'Containers', skills: data.skills.containers || [] },
          {
            category: 'Orchestration',
            skills: data.skills.orchestration || [],
          },
          {
            category: 'Infrastructure as Code (IaC)',
            skills: data.skills.iac || [],
          },
          { category: 'CI/CD & DevOps', skills: data.skills.ci_cd || [] },
          {
            category: 'Version Control',
            skills: data.skills.version_control || [],
          },
          {
            category: 'Monitoring & Logging',
            skills: data.skills.monitoring_logging || [],
          },
          {
            category: 'Bases de données',
            skills: data.skills.databases_cache || [],
          },
          { category: 'Search Engines', skills: data.skills.search || [] },
          { category: 'Security', skills: data.skills.security || [] },
          { category: 'Scripting', skills: data.skills.scripting || [] },
          { category: 'Tools & Others', skills: data.skills.other_tools || [] },
        ];

        for (const { category, skills } of skillCategories) {
          if (skills && skills.length > 0) {
            this.logger.log(
              `🛠️ [SKILLS_${category}] Found ${skills.length} skills in category ${category}`
            );

            for (const skill of skills) {
              if (skill && skill.trim()) {
                const skillData = {
                  cvId,
                  category, // Required field - hardcoded category names
                  name: skill.trim(), // Required field - validated above
                  level: 'Intermédiaire', // Default level
                  order: order++,
                };

                this.logger.log(
                  `💾 [SKILL_${order - 1}_DATA] ${JSON.stringify(
                    skillData,
                    null,
                    2
                  )}`
                );

                skillsPromises.push(
                  this.prisma.competence.create({
                    data: skillData,
                  })
                );
              } else {
                this.logger.warn(
                  `⚠️ [SKILLS_${category}] Skipping empty skill`
                );
              }
            }
          }
        }

        if (skillsPromises.length > 0) {
          this.logger.log(
            `⏳ [SKILLS] Saving ${skillsPromises.length} skills...`
          );
          await Promise.all(skillsPromises);
          this.logger.log(`✅ [SKILLS] All skills saved successfully`);
        } else {
          this.logger.log(`⏭️ [SKILLS] No skills to save`);
        }
      } else {
        this.logger.log(`⏭️ [SKILLS] No skills data available`);
      }

      // Save languages
      this.logger.log(`🗣️ [LANGUAGES] Processing languages...`);
      if (data.languages && data.languages.length > 0) {
        this.logger.log(
          `🗣️ [LANGUAGES] Found ${data.languages.length} languages to save`
        );

        // Filter out languages with empty names and validate required fields
        const validLanguages = data.languages.filter((lang, index) => {
          const languageName = lang.language?.trim();
          if (!languageName) {
            this.logger.warn(
              `⚠️ [LANG_${index}] Skipping language with empty name`
            );
            return false;
          }
          return true;
        });

        const languagePromises = validLanguages.map((lang, index) => {
          const languageData = {
            cvId,
            name: lang.language.trim(), // Required field - already validated above
            level: lang.proficiency?.trim() || null,
            order: index,
          };

          this.logger.log(
            `💾 [LANG_${index}_DATA] ${JSON.stringify(languageData, null, 2)}`
          );

          return this.prisma.langue.create({
            data: languageData,
          });
        });

        if (languagePromises.length > 0) {
          this.logger.log(
            `⏳ [LANGUAGES] Saving ${languagePromises.length} languages...`
          );
          await Promise.all(languagePromises);
          this.logger.log(`✅ [LANGUAGES] All languages saved successfully`);
        } else {
          this.logger.log(`⏭️ [LANGUAGES] No valid languages to save`);
        }
      } else {
        this.logger.log(`⏭️ [LANGUAGES] No languages to save`);
      }

      this.logger.log(
        `✅ [CUSTOM_SUCCESS] Custom schema data saved successfully for CV ${cvId}`
      );
    } catch (error) {
      this.logger.error(
        `❌ [CUSTOM_ERROR] Error in saveCustomSchemaData for CV ${cvId}:`
      );
      this.logger.error(`💥 [CUSTOM_ERROR_NAME] ${error.constructor.name}`);
      this.logger.error(`💬 [CUSTOM_ERROR_MSG] ${error.message}`);
      this.logger.error(`📍 [CUSTOM_ERROR_STACK] ${error.stack}`);
      throw error;
    }
  }

  private async saveLegacySchemaData(
    cvId: string,
    data: CVOCRResult
  ): Promise<void> {
    // Save personal information
    if (data.personalInfo) {
      const personalInfo = data.personalInfo;
      const [firstName, ...lastNameParts] = (personalInfo.fullName || '').split(
        ' '
      );
      const lastName = lastNameParts.join(' ');

      await this.prisma.informationPersonnelle.create({
        data: {
          cvId,
          firstName: firstName || null,
          lastName: lastName || null,
          email: personalInfo.email || null,
          phone: personalInfo.phone || null,
          address: personalInfo.address || null,
          website: personalInfo.website || null,
          linkedin: personalInfo.linkedin || null,
          github: personalInfo.github || null,
        },
      });
    }

    // Save profile/summary
    if (data.professionalSummary) {
      await this.prisma.profil.create({
        data: {
          cvId,
          summary: data.professionalSummary,
        },
      });
    }

    // Save work experiences
    if (data.workExperience && data.workExperience.length > 0) {
      const experiencePromises = data.workExperience.map((exp, index) => {
        const { startMonth, startYear, endMonth, endYear, isCurrent } =
          this.parseLegacyDate(exp.duration);

        return this.prisma.experienceProfessionnelle.create({
          data: {
            cvId,
            title:
              exp.jobTitle?.trim() ||
              exp.company?.trim() ||
              `Experience ${index + 1}`, // Required field
            company: exp.company?.trim() || null,
            location: exp.location?.trim() || null,
            startMonth,
            startYear,
            endMonth,
            endYear,
            current: isCurrent,
            description: null,
            responsibilities: Array.isArray((exp as any).responsibilities)
              ? (exp as any).responsibilities.filter((r) => r?.trim())
              : [],
            achievements: Array.isArray((exp as any).achievements)
              ? (exp as any).achievements.filter((a) => a?.trim())
              : [],
            technologies: [], // Legacy schema doesn't have technologies
            order: index,
          },
        });
      });
      await Promise.all(experiencePromises);
    }

    // Save education
    if (data.education && data.education.length > 0) {
      const educationPromises = data.education.map((edu, index) =>
        this.prisma.formation.create({
          data: {
            cvId,
            degree: edu.degree?.trim() || `Education ${index + 1}`, // Required field
            institution: edu.institution?.trim() || null,
            location: edu.location?.trim() || null,
            startYear: edu.year?.toString() || null,
            endYear: edu.year?.toString() || null,
            finished: true,
            description: null,
            gpa: edu.gpa?.trim() || null,
            honors: Array.isArray(edu.honors)
              ? edu.honors.filter((h) => h?.trim())
              : [],
            activities: [],
            order: index,
          },
        })
      );
      await Promise.all(educationPromises);
    }

    // Save skills
    if (data.skills) {
      const skillsPromises: Promise<any>[] = [];
      let order = 0;

      const skillCategories = [
        { category: 'Technique', skills: data.skills.technical || [] },
        {
          category: 'Langages de programmation',
          skills: data.skills.languages || [],
        },
        { category: 'Soft Skills', skills: data.skills.soft || [] },
        { category: 'Outils', skills: data.skills.tools || [] },
      ];

      for (const { category, skills } of skillCategories) {
        for (const skill of skills) {
          if (skill && skill.trim()) {
            skillsPromises.push(
              this.prisma.competence.create({
                data: {
                  cvId,
                  category,
                  name: skill.trim(),
                  level: 'Intermédiaire',
                  order: order++,
                },
              })
            );
          }
        }
      }

      if (skillsPromises.length > 0) {
        await Promise.all(skillsPromises);
      }
    }
  }

  private parseDate(
    startDate?: string,
    endDate?: string
  ): {
    startMonth: string | null;
    startYear: string | null;
    endMonth: string | null;
    endYear: string | null;
    isCurrent: boolean;
  } {
    const result = {
      startMonth: null as string | null,
      startYear: null as string | null,
      endMonth: null as string | null,
      endYear: null as string | null,
      isCurrent: false,
    };

    // Parse start date
    if (startDate) {
      const startMatch = startDate.match(/(\d{4})|(\d{1,2})\/(\d{4})/);
      if (startMatch) {
        if (startMatch[1]) {
          result.startYear = startMatch[1];
        } else if (startMatch[2] && startMatch[3]) {
          result.startMonth = startMatch[2].padStart(2, '0');
          result.startYear = startMatch[3];
        }
      }
    }

    // Parse end date
    if (endDate) {
      const isPresent = /present|current|aujourd'hui|maintenant/i.test(endDate);
      if (isPresent) {
        result.isCurrent = true;
      } else {
        const endMatch = endDate.match(/(\d{4})|(\d{1,2})\/(\d{4})/);
        if (endMatch) {
          if (endMatch[1]) {
            result.endYear = endMatch[1];
          } else if (endMatch[2] && endMatch[3]) {
            result.endMonth = endMatch[2].padStart(2, '0');
            result.endYear = endMatch[3];
          }
        }
      }
    }

    return result;
  }

  private parseLegacyDate(duration?: string): {
    startMonth: string | null;
    startYear: string | null;
    endMonth: string | null;
    endYear: string | null;
    isCurrent: boolean;
  } {
    const result = {
      startMonth: null as string | null,
      startYear: null as string | null,
      endMonth: null as string | null,
      endYear: null as string | null,
      isCurrent: false,
    };

    if (!duration) return result;

    // Check if current/present
    const isPresent = /present|current|aujourd'hui|maintenant/i.test(duration);
    if (isPresent) {
      result.isCurrent = true;
    }

    // Try to extract years like "2020-2022" or "2020 - Present"
    const yearMatch = duration.match(
      /(\d{4})\s*[-–]\s*(\d{4}|present|current)/i
    );
    if (yearMatch) {
      result.startYear = yearMatch[1];
      if (yearMatch[2] && !/present|current/i.test(yearMatch[2])) {
        result.endYear = yearMatch[2];
      }
      return result;
    }

    // Try to extract single year like "2020"
    const singleYearMatch = duration.match(/(\d{4})/);
    if (singleYearMatch) {
      result.startYear = singleYearMatch[1];
      result.endYear = singleYearMatch[1];
      return result;
    }

    return result;
  }

  async findAllUserCVs(userId: string): Promise<any[]> {
    return this.prisma.cV.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        informationPersonnelle: true,
        profil: true,
        experiencesProfessionnelles: {
          orderBy: { order: 'asc' },
        },
        formations: {
          orderBy: { order: 'asc' },
        },
        competences: {
          orderBy: { order: 'asc' },
        },
        langues: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async findCVById(id: string, userId: string): Promise<any> {
    const cv = await this.prisma.cV.findFirst({
      where: { id, userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        informationPersonnelle: true,
        profil: true,
        experiencesProfessionnelles: {
          orderBy: { order: 'asc' },
        },
        formations: {
          orderBy: { order: 'asc' },
        },
        competences: {
          orderBy: { order: 'asc' },
        },
        langues: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!cv) {
      throw new BadRequestException('CV not found');
    }

    return cv;
  }

  async deleteCVById(id: string, userId: string): Promise<void> {
    const cv = await this.prisma.cV.findFirst({
      where: { id, userId },
    });

    if (!cv) {
      throw new BadRequestException('CV not found');
    }

    await this.prisma.cV.delete({
      where: { id },
    });

    this.logger.log(`CV deleted: ${cv.fileName} for user ${userId}`);
  }
}
