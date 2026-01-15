export enum CVStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// Legacy schema interface (for image files)
export interface CVOCRData {
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
    technologies?: string[];
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

// New custom schema interface (for PDF files)
export interface CustomCVData {
  name: string;
  headline: string;
  years_experience: string;
  contact: {
    email: string;
    phone: string;
    location: {
      address: string;
      postcode: string;
      city: string;
    };
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
    location: string;
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

export interface CV {
  id: string;
  title: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  status: CVStatus;
  createdAt: string;
  updatedAt: string;
  template?: string; // Template used (modern, professional, etc.)
  ocrData?: CVOCRData | CustomCVData;
  extractedText?: string;
  confidence?: number;
  processingNotes?: string[];
  user?: {
    id: string;
    name?: string;
    email: string;
  };
}

export interface CVUploadResponse {
  cv: CV;
  ocrData: CVOCRData | CustomCVData;
  schemaType: 'legacy' | 'custom';
}
