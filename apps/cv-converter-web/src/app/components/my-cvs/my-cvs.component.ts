import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
} from '@angular/forms';
import {
  DragDropModule,
  CdkDragDrop,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { CustomCVData, CVOCRData, CV } from '../../models/cv.model';
import { CvService } from '../../services/cv.service';

interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  profession?: string;
  photo?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  drivingLicense?: boolean;
  gender?: string;
  nationality?: string;
  maritalStatus?: string;
  website?: string;
  linkedin?: string;
}

interface Experience {
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  technologies: string[];
}

interface Education {
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  description?: string;
}

interface SkillCategory {
  name: string;
  skills: Skill[];
}

interface Skill {
  name: string;
  level: string;
}

interface Language {
  name: string;
  level: string;
}

interface Interest {
  name: string;
}

interface CVTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };
}

// Types for CV management
type ViewMode = 'list' | 'form';
type ListLayout = 'table' | 'cards';
type SortField = 'title' | 'updatedAt' | 'status' | 'template';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-my-cvs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DragDropModule],
  templateUrl: './my-cvs.component.html',
  styleUrl: './my-cvs.component.scss',
})
export class MyCvsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private cvService = inject(CvService);

  // Template management
  selectedTemplate = signal<string>('modern');

  availableTemplates: CVTemplate[] = [
    {
      id: 'modern',
      name: 'Moderne',
      description: 'Design contemporain avec dégradé coloré',
      preview: '🎨',
      colorScheme: {
        primary: '#667eea',
        secondary: '#764ba2',
        accent: '#10b981',
        text: '#1f2937',
        background: '#ffffff',
      },
    },
    {
      id: 'professional',
      name: 'Professionnel',
      description: 'Style classique et élégant',
      preview: '💼',
      colorScheme: {
        primary: '#1f2937',
        secondary: '#374151',
        accent: '#3b82f6',
        text: '#111827',
        background: '#ffffff',
      },
    },
    {
      id: 'creative',
      name: 'Créatif',
      description: 'Design artistique et original',
      preview: '🎭',
      colorScheme: {
        primary: '#ec4899',
        secondary: '#8b5cf6',
        accent: '#f59e0b',
        text: '#1f2937',
        background: '#fdf2f8',
      },
    },
    {
      id: 'minimalist',
      name: 'Minimaliste',
      description: 'Épuré et sophistiqué',
      preview: '⚪',
      colorScheme: {
        primary: '#6b7280',
        secondary: '#4b5563',
        accent: '#059669',
        text: '#1f2937',
        background: '#ffffff',
      },
    },
    {
      id: 'tech',
      name: 'Tech',
      description: 'Pour les profils techniques',
      preview: '💻',
      colorScheme: {
        primary: '#0ea5e9',
        secondary: '#0284c7',
        accent: '#06b6d4',
        text: '#0c4a6e',
        background: '#f0f9ff',
      },
    },
  ];

  cvForm = this.fb.group({
    personalInfo: this.fb.group({
      firstName: ['Emilie', Validators.required],
      lastName: ['Michaud', Validators.required],
      email: [
        'michaud.emilie@gmail.com',
        [Validators.required, Validators.email],
      ],
      phone: ['06 06 06 06 06', Validators.required],
      address: [''],
      postalCode: [''],
      city: [''],
      headline: ['INGENIEUR DEVOPS CLOUD AWS'],
      photo: [''],
      dateOfBirth: [''],
      placeOfBirth: [''],
      drivingLicense: [false],
      gender: [''],
      nationality: [''],
      maritalStatus: [''],
      website: [''],
      linkedin: [''],
    }),
    summary: [''],
    yearsOfExperience: [''],
    experience: this.fb.array([]),
    education: this.fb.array([]),
    skills: this.fb.array([]),
    languages: this.fb.array([]),
    interests: this.fb.array([]),
  });

  // Form getters
  get personalInfo() {
    return this.cvForm.get('personalInfo') as FormGroup;
  }
  get experience() {
    return this.cvForm.get('experience') as FormArray;
  }
  get education() {
    return this.cvForm.get('education') as FormArray;
  }
  get skills() {
    return this.cvForm.get('skills') as FormArray;
  }
  get languages() {
    return this.cvForm.get('languages') as FormArray;
  }
  get interests() {
    return this.cvForm.get('interests') as FormArray;
  }

  // Sections visibility
  showPersonalInfoDetails = signal(false);
  activeSection = signal('personalInfo');
  showAISuggestionsFor = signal<number | null>(null);

  // CV Management State
  // View state
  currentView = signal<ViewMode>('list');
  listLayout = signal<ListLayout>('table');
  isLoading = signal(false);
  error = signal<string>('');

  // CV data
  cvs = signal<CV[]>([]);
  searchTerm = signal<string>('');
  selectedStatus = signal<any>('all');
  selectedTemplateFilter = signal<string | 'all'>('all');
  sortField = signal<SortField>('updatedAt');
  sortDirection = signal<SortDirection>('desc');
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);

  // Modal states
  cvToDelete = signal<CV | null>(null);
  showDeleteModal = signal<boolean>(false);
  cvToView = signal<CV | null>(null);
  showViewModal = signal<boolean>(false);
  currentCvId = signal<string | null>(null);

  // CV Upload functionality
  selectedFile = signal<File | null>(null);
  isUploading = signal(false);
  uploadError = signal('');
  showUploadModal = signal(false);
  successMessage = signal('');

  // Template management for form view
  selectedTemplateId = signal<string>('modern');

  // Computed properties
  isEditing = computed(() => this.currentCvId() !== null);

  filteredCvs = computed(() => {
    let filtered = this.cvs();

    // Apply search filter
    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(
        (cv) =>
          cv.title.toLowerCase().includes(term) ||
          (cv.fileName && cv.fileName.toLowerCase().includes(term))
      );
    }

    // Apply status filter
    if (this.selectedStatus() !== 'all') {
      filtered = filtered.filter((cv) => cv.status === this.selectedStatus());
    }

    // Apply template filter
    if (this.selectedTemplateFilter() !== 'all') {
      filtered = filtered.filter(
        (cv) => cv.template === this.selectedTemplateFilter()
      );
    }

    return filtered;
  });

  sortedCvs = computed(() => {
    const filtered = this.filteredCvs();
    const field = this.sortField();
    const direction = this.sortDirection();

    return [...filtered].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      // Handle field access
      switch (field) {
        case 'title':
          aValue = a.title;
          bValue = b.title;
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'template':
          aValue = a.template || '';
          bValue = b.template || '';
          break;
        default:
          aValue = '';
          bValue = '';
      }

      // Handle string sorting
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  });

  paginatedCvs = computed(() => {
    const sorted = this.sortedCvs();
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return sorted.slice(start, end);
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredCvs().length / this.pageSize());
  });

  visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    const maxVisible = 5;

    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    const end = Math.min(total, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  });

  statusOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'pending', label: 'En attente' },
    { value: 'processing', label: 'En cours' },
    { value: 'completed', label: 'Terminé' },
    { value: 'failed', label: 'Échec' },
  ];

  templateOptions = computed(() => [
    { value: 'all', label: 'Tous les modèles' },
    ...this.availableTemplates.map((t) => ({ value: t.id, label: t.name })),
  ]);

  Math = Math;

  constructor() {
    this.initializeDefaultData();
  }

  ngOnInit() {
    if (this.currentView() === 'list') {
      this.loadCVs();
    }
  }

  private initializeDefaultData() {
    // Add sample experience (finished/collapsed)
    this.addExperience();
    this.experience.at(0).patchValue({
      title: 'Bénévolat Traductrice Stagiaire',
      company: 'EDF',
      location: 'Paris (75)',
      startMonth: '02',
      startYear: '2014',
      endMonth: '02',
      endYear: '2014',
      current: false,
      description:
        "• Stage d'observation 3 ème (1 semaine)<br>• Participation aux réunions<br>• Rédactions de comptes-rendus courts",
      finished: true,
      editing: false,
    });

    // Add sample technologies to first experience
    this.addExperienceTechnology(0, 'JavaScript');
    this.addExperienceTechnology(0, 'HTML/CSS');
    this.addExperienceTechnology(0, 'Microsoft Office');

    // Add second sample experience (finished/collapsed)
    this.addExperience();
    this.experience.at(1).patchValue({
      title: 'Stage / Job Étudiant',
      company: 'Le Secours Populaire',
      location: 'Paris (75)',
      startMonth: '03',
      startYear: '2021',
      endMonth: '03',
      endYear: '2021',
      current: false,
      description:
        "• Collecte de nourriture<br>• Accueil des personnes en difficulté<br>• Animation d'atelier de sensibilisation",
      finished: true,
      editing: false,
    });

    // Add sample technologies to second experience
    this.addExperienceTechnology(1, 'Communication');
    this.addExperienceTechnology(1, 'Gestion de projet');

    // Add sample education
    this.addEducation();
    this.education.at(0).patchValue({
      degree: 'Baccalauréat Littéraire',
      institution: 'Lycée Aristide Briand',
      location: 'Paris (75)',
      startMonth: '09',
      startYear: '2019',
      endMonth: '06',
      endYear: '2019',
      description:
        '• Mention Bien<br>• Option art du spectacle<br>• Classe européenne<br>• UNSS badminton',
      editing: true,
    });

    // Add second sample education (finished/collapsed)
    this.addEducation();
    this.education.at(1).patchValue({
      degree: 'Licence LEA Anglais / Italien',
      institution: 'Université',
      location: 'Paris (75)',
      startMonth: '09',
      startYear: '2019',
      endMonth: '06',
      endYear: '2022',
      description: '• Civilisation<br>• Droit<br>• Économie<br>• Traduction',
      finished: true,
      editing: false,
    });

    // Add sample skill categories with skills
    this.addSkillCategory('Cloud');
    this.addSkillToCategory(0, 'AWS EC2', 'Avancé');
    this.addSkillToCategory(0, 'AWS S3', 'Avancé');
    this.addSkillToCategory(0, 'Azure', 'Intermédiaire');

    this.addSkillCategory('DevOps & CI/CD');
    this.addSkillToCategory(1, 'Docker', 'Avancé');
    this.addSkillToCategory(1, 'Jenkins', 'Intermédiaire');
    this.addSkillToCategory(1, 'GitLab CI', 'Avancé');

    this.addSkillCategory('Langages de programmation');
    this.addSkillToCategory(2, 'TypeScript', 'Avancé');
    this.addSkillToCategory(2, 'Python', 'Intermédiaire');
    this.addSkillToCategory(2, 'JavaScript', 'Avancé');
  }

  // Experience methods
  createExperienceFormGroup(): FormGroup {
    return this.fb.group({
      title: ['', Validators.required],
      company: ['', Validators.required],
      location: [''],
      startMonth: [''],
      startYear: [''],
      endMonth: [''],
      endYear: [''],
      current: [false],
      description: [''],
      finished: [false],
      editing: [true],
      technologies: this.fb.array([]),
    });
  }

  addExperience() {
    this.experience.push(this.createExperienceFormGroup());
  }

  removeExperience(index: number) {
    this.experience.removeAt(index);
  }

  finishExperience(index: number) {
    this.experience.at(index).patchValue({ finished: true, editing: false });
  }

  editExperience(index: number) {
    this.experience.at(index).patchValue({ editing: true });
  }

  isExperienceFinished(index: number): boolean {
    return this.experience.at(index)?.get('finished')?.value === true;
  }

  isExperienceEditing(index: number): boolean {
    return this.experience.at(index)?.get('editing')?.value === true;
  }

  onExperienceDrop(event: CdkDragDrop<string[]>) {
    if (event.previousIndex !== event.currentIndex) {
      // Get the current values to preserve all data
      const experienceValues = this.experience.value;

      // Reorder the values array
      moveItemInArray(
        experienceValues,
        event.previousIndex,
        event.currentIndex
      );

      // Clear and rebuild the FormArray with reordered values
      this.experience.clear();
      experienceValues.forEach((value: any) => {
        this.experience.push(this.createExperienceFormGroupWithValue(value));
      });
    }
  }

  private createExperienceFormGroupWithValue(value: any): FormGroup {
    const technologiesArray = this.fb.array(
      (value.technologies || []).map((tech: string) => this.fb.control(tech))
    );

    return this.fb.group({
      title: [value.title || '', Validators.required],
      company: [value.company || '', Validators.required],
      location: [value.location || ''],
      startMonth: [value.startMonth || ''],
      startYear: [value.startYear || ''],
      endMonth: [value.endMonth || ''],
      endYear: [value.endYear || ''],
      current: [value.current || false],
      description: [value.description || ''],
      finished: [value.finished || false],
      editing: [value.editing !== undefined ? value.editing : true],
      technologies: technologiesArray,
    });
  }

  getExperienceSummary(index: number): {
    title: string;
    subtitle: string;
    period: string;
  } {
    const exp = this.experience.at(index);
    const title = exp.get('title')?.value || '';
    const company = exp.get('company')?.value || '';
    const location = exp.get('location')?.value || '';

    const startMonth = exp.get('startMonth')?.value;
    const startYear = exp.get('startYear')?.value;
    const endMonth = exp.get('endMonth')?.value;
    const endYear = exp.get('endYear')?.value;
    const current = exp.get('current')?.value;

    const technologies = exp.get('technologies')?.value || [];

    let period = '';
    if (startMonth && startYear) {
      period = `de ${this.getMonthName(startMonth)} ${startYear}`;
      if (current) {
        period += ' à ce jour';
      } else if (endMonth && endYear) {
        period += ` à ${this.getMonthName(endMonth)} ${endYear}`;
      }
    }

    return {
      title: title,
      subtitle: `${company}${location ? ', ' + location : ''}`,
      period: period,
    };
  }

  showAISuggestionsExperience = signal<number | null>(null);

  showAISuggestionsExp(index: number) {
    this.showAISuggestionsExperience.set(
      this.showAISuggestionsExperience() === index ? null : index
    );
  }

  applySuggestionExp(index: number, suggestion: string) {
    const editor = document.getElementById(`exp-editor-${index}`);
    if (editor) {
      const currentContent = editor.innerHTML;
      const newContent = currentContent
        ? `${currentContent}<br>• ${suggestion}`
        : `• ${suggestion}`;
      editor.innerHTML = newContent;
      this.updateExperienceDescription(index, newContent);
    }
    this.showAISuggestionsExperience.set(null);
  }

  formatTextExp(command: string, index: number) {
    const editor = document.getElementById(`exp-editor-${index}`);
    if (editor) {
      editor.focus();
      document.execCommand(command, false, undefined);
      this.updateExperienceDescription(index, editor.innerHTML);
    }
  }

  onExperienceDescriptionChange(event: Event, index: number) {
    const target = event.target as HTMLElement;
    this.updateExperienceDescription(index, target.innerHTML);
  }

  private updateExperienceDescription(index: number, content: string) {
    this.experience.at(index).patchValue({ description: content });
  }

  // Technology management methods for Experience
  getExperienceTechnologies(expIndex: number): FormArray {
    const exp = this.experience.at(expIndex);
    if (!exp) {
      return this.fb.array([]);
    }
    return exp.get('technologies') as FormArray;
  }

  addExperienceTechnology(expIndex: number, technology?: string) {
    const techArray = this.getExperienceTechnologies(expIndex);
    techArray.push(this.fb.control(technology || ''));
  }

  removeExperienceTechnology(expIndex: number, techIndex: number) {
    const techArray = this.getExperienceTechnologies(expIndex);
    techArray.removeAt(techIndex);
  }

  updateExperienceTechnology(
    expIndex: number,
    techIndex: number,
    value: string
  ) {
    const techArray = this.getExperienceTechnologies(expIndex);
    techArray.at(techIndex).setValue(value);
  }

  // Education methods
  createEducationFormGroup(): FormGroup {
    return this.fb.group({
      degree: ['', Validators.required],
      institution: ['', Validators.required],
      location: [''],
      startMonth: [''],
      startYear: [''],
      endMonth: [''],
      endYear: [''],
      current: [false],
      description: [''],
      finished: [false],
      editing: [true],
    });
  }

  addEducation() {
    this.education.push(this.createEducationFormGroup());
  }

  removeEducation(index: number) {
    this.education.removeAt(index);
  }

  // Skills methods - Categorized Skills System
  defaultSkillCategories = [
    { name: 'Cloud', skills: [] },
    { name: 'Infrastructure as Code (IaC)', skills: [] },
    { name: 'CI/CD & DevOps', skills: [] },
    { name: 'Orchestration & Containers', skills: [] },
    { name: 'Monitoring & Logging', skills: [] },
    { name: 'Bases de données', skills: [] },
    { name: 'Langages de programmation', skills: [] },
    { name: 'Frameworks & Bibliothèques', skills: [] },
  ];

  createSkillCategoryFormGroup(categoryName?: string): FormGroup {
    return this.fb.group({
      name: [categoryName || '', Validators.required],
      skills: this.fb.array([]),
    });
  }

  createSkillFormGroup(skillName?: string, level?: string): FormGroup {
    return this.fb.group({
      name: [skillName || '', Validators.required],
      level: [level || 'Intermédiaire', Validators.required],
    });
  }

  getSkillCategory(categoryIndex: number): FormGroup {
    return this.skills.at(categoryIndex) as FormGroup;
  }

  getSkillsInCategory(categoryIndex: number): FormArray {
    const category = this.getSkillCategory(categoryIndex);
    if (!category) {
      return this.fb.array([]);
    }
    return category.get('skills') as FormArray;
  }

  addSkillCategory(categoryName?: string) {
    const newCategory = this.createSkillCategoryFormGroup(categoryName);
    this.skills.push(newCategory);
  }

  removeSkillCategory(categoryIndex: number) {
    this.skills.removeAt(categoryIndex);
  }

  addSkillToCategory(
    categoryIndex: number,
    skillName?: string,
    level?: string
  ) {
    const skillsArray = this.getSkillsInCategory(categoryIndex);
    const newSkill = this.createSkillFormGroup(skillName, level);
    skillsArray.push(newSkill);
  }

  removeSkillFromCategory(categoryIndex: number, skillIndex: number) {
    const skillsArray = this.getSkillsInCategory(categoryIndex);
    skillsArray.removeAt(skillIndex);
  }

  updateSkillInCategory(
    categoryIndex: number,
    skillIndex: number,
    skillName: string
  ) {
    const skillsArray = this.getSkillsInCategory(categoryIndex);
    const skill = skillsArray.at(skillIndex);
    if (skill) {
      skill.patchValue({ name: skillName });
    }
  }

  // Legacy compatibility method for old addSkill() calls
  addSkill() {
    // If no categories exist, add a default "Autres" category
    if (this.skills.length === 0) {
      this.addSkillCategory('Autres');
    }
    // Add skill to the last category
    this.addSkillToCategory(this.skills.length - 1);
  }

  // Legacy compatibility method
  removeSkill(index: number) {
    // For backwards compatibility, remove entire category if only one skill
    if (this.skills.length > 0) {
      const lastCategoryIndex = this.skills.length - 1;
      const skillsInLastCategory = this.getSkillsInCategory(lastCategoryIndex);
      if (skillsInLastCategory.length > 0) {
        this.removeSkillFromCategory(
          lastCategoryIndex,
          skillsInLastCategory.length - 1
        );
      }
    }
  }

  // Languages methods
  createLanguageFormGroup(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      level: ['A1', Validators.required],
    });
  }

  addLanguage() {
    this.languages.push(this.createLanguageFormGroup());
  }

  removeLanguage(index: number) {
    this.languages.removeAt(index);
  }

  // Interests methods
  createInterestFormGroup(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
    });
  }

  addInterest() {
    this.interests.push(this.createInterestFormGroup());
  }

  removeInterest(index: number) {
    this.interests.removeAt(index);
  }

  // Utility methods
  setActiveSection(section: string) {
    this.activeSection.set(section);
  }

  togglePersonalInfoDetails() {
    this.showPersonalInfoDetails.update((value) => !value);
  }

  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.personalInfo.patchValue({ photo: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  }

  getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  saveCv() {
    if (this.cvForm.valid) {
      console.log('CV Data:', this.cvForm.value);
      // Implement save functionality
    } else {
      console.log('Form is invalid');
      this.cvForm.markAllAsTouched();
    }
  }

  async exportWord(): Promise<void> {
    try {
      const template = this.getCurrentTemplate();
      const formData = this.cvForm.value;

      console.warn('formData.skills', formData.skills);
      console.warn('formData.experience', formData.experience);
      // Prepare data for Word generation API
      const documentData = {
        // Basic info
        fullName:
          formData.personalInfo?.firstName +
          ' ' +
          formData.personalInfo?.lastName,
        firstName: formData.personalInfo?.firstName || '',
        lastName: formData.personalInfo?.lastName || '',
        headline: formData.personalInfo?.headline || '',
        email: formData.personalInfo?.email || '',
        phone: formData.personalInfo?.phone || '',
        address: formData.personalInfo?.address || '',
        postalCode: formData.personalInfo?.postalCode || '',
        city: formData.personalInfo?.city || '',
        linkedin: formData.personalInfo?.linkedin || '',
        years_experience: formData.yearsOfExperience || '',

        // Profile summary
        summary: this.stripHtml(formData.summary || ''),

        // Experience (only finished ones)
        experience:
          formData.experience
            ?.filter((exp: any) => exp.finished)
            .map((exp: any) => ({
              title: exp.title || '',
              company: exp.company || '',
              location: exp.location || '',
              description: this.splitByBrClean(exp.description || ''),
              //exp.description || this.stripHtml(exp.description || ''),
              startDate: this.formatDateForWord(exp.startMonth, exp.startYear),
              endDate: exp.current
                ? 'Présent'
                : this.formatDateForWord(exp.endMonth, exp.endYear),
              period: this.formatPeriod(
                exp.startMonth,
                exp.startYear,
                exp.endMonth,
                exp.endYear,
                exp.current
              ),
              technologies: exp.technologies || [],
            })) || [],

        // Education (only finished ones)
        education:
          formData.education
            ?.filter((edu: any) => edu.finished)
            .map((edu: any) => ({
              degree: edu.degree || '',
              institution: edu.institution || '',
              location: edu.location || '',
              description: this.stripHtml(edu.description || ''),
              startDate: edu.startYear, //start_date, //this.formatDateForWord(edu.startMonth, edu.startYear),
              endDate: edu.current ? 'En cours' : edu.endYear, //edu.end_date, //this.formatDateForWord(edu.endMonth, edu.endYear),
              period: this.formatPeriod(
                edu.startMonth,
                edu.startYear,
                edu.endMonth,
                edu.endYear,
                edu.current
              ),
            })) || [],

        // Skills
        skills:
          formData.skills?.map((skill: any) => ({
            category: skill.name || '',
            skills:
              skill.skills?.map((skill: any, i: number, arr: any[]) => ({
                name: skill.name,
                level: skill.level,
                isLast: i === arr.length - 1,
              })) || [],
          })) || [],

        // Languages
        languages:
          formData.languages?.map((lang: any, i: number, arr: any[]) => ({
            name: lang.name || '',
            level: lang.level || '',
            isLast: i === arr.length - 1,
          })) || [],

        // Interests
        interests:
          formData.interests
            ?.map((interest: any) => interest.name)
            .join(', ') || '',

        // Template info
        template: template.id,
        templateName: template.name,
        colorScheme: template.colorScheme,
      };

      const fileName = `CV_${documentData.fullName}_${template.name}_${
        new Date().toISOString().split('T')[0]
      }`;

      console.log('🔄 Generating Word document with custom data...');
      console.log('📊 Document data:', documentData);

      // Call the correct API endpoint
      const response = await fetch(
        `${environment.apiUrl}/documents/generate-custom`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          },
          body: JSON.stringify({
            templateName: 'cv-template.docx',
            data: documentData,
            outputName: fileName,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // Download the generated Word document
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('✅ Word document generated and downloaded successfully');
    } catch (error) {
      console.error('❌ Error generating Word document:', error);
      alert(
        `Erreur lors de la génération du document Word: ${
          (error as Error).message
        }`
      );
    }
  }

  private splitByBrClean(input: string): string[] {
    return input
      .split(/<br\s*\/?>/i)
      .map((x) => x.trim())
      .filter((x) => x.length > 0);
  }

  private formatDateForWord(month?: string, year?: string): string {
    if (!month || !year) return '';
    return `${this.getMonthName(month)} ${year}`;
  }

  private formatPeriod(
    startMonth?: string,
    startYear?: string,
    endMonth?: string,
    endYear?: string,
    current?: boolean
  ): string {
    let period = '';
    if (startMonth && startYear) {
      period += `${this.getMonthName(startMonth)} ${startYear}`;
    }
    if (current) {
      period += ' - Présent';
    } else if (endMonth && endYear) {
      period += ` - ${this.getMonthName(endMonth)} ${endYear}`;
    }
    return period;
  }

  private stripHtml(html: string): string {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  // Update the existing exportPdf method to call exportWord
  exportPdf(): void {
    this.exportWord();
  }

  // Rich text editor methods
  getYearRange(): number[] {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear + 5; year >= currentYear - 50; year--) {
      years.push(year);
    }
    return years;
  }

  formatText(command: string, index: number) {
    const editor = document.getElementById(`editor-${index}`);
    if (editor) {
      editor.focus();
      document.execCommand(command, false, undefined);
      this.updateFormDescription(index, editor.innerHTML);
    }
  }

  isFormatActive(command: string, index: number): boolean {
    return document.queryCommandState(command);
  }

  onDescriptionChange(event: Event, index: number) {
    const target = event.target as HTMLElement;
    this.updateFormDescription(index, target.innerHTML);
  }

  private updateFormDescription(index: number, content: string) {
    this.education.at(index).patchValue({ description: content });
  }

  showAISuggestions(index: number) {
    this.showAISuggestionsFor.set(
      this.showAISuggestionsFor() === index ? null : index
    );
  }

  applySuggestion(index: number, suggestion: string) {
    const editor = document.getElementById(`editor-${index}`);
    if (editor) {
      const currentContent = editor.innerHTML;
      const newContent = currentContent
        ? `${currentContent}<br>• ${suggestion}`
        : `• ${suggestion}`;
      editor.innerHTML = newContent;
      this.updateFormDescription(index, newContent);
    }
    this.showAISuggestionsFor.set(null);
  }

  finishEducation(index: number) {
    this.education.at(index).patchValue({ finished: true, editing: false });
  }

  editEducation(index: number) {
    this.education.at(index).patchValue({ editing: true });
  }

  isEducationFinished(index: number): boolean {
    return this.education.at(index)?.get('finished')?.value === true;
  }

  isEducationEditing(index: number): boolean {
    return this.education.at(index)?.get('editing')?.value === true;
  }

  onEducationDrop(event: CdkDragDrop<string[]>) {
    if (event.previousIndex !== event.currentIndex) {
      // Get the current values to preserve all data
      const educationValues = this.education.value;

      // Reorder the values array
      moveItemInArray(educationValues, event.previousIndex, event.currentIndex);

      // Clear and rebuild the FormArray with reordered values
      this.education.clear();
      educationValues.forEach((value: any) => {
        this.education.push(this.createEducationFormGroupWithValue(value));
      });
    }
  }

  private createEducationFormGroupWithValue(value: any): FormGroup {
    return this.fb.group({
      degree: [value.degree || '', Validators.required],
      institution: [value.institution || '', Validators.required],
      location: [value.location || ''],
      startMonth: [value.startMonth || ''],
      startYear: [value.startYear || ''],
      endMonth: [value.endMonth || ''],
      endYear: [value.endYear || ''],
      current: [value.current || false],
      description: [value.description || ''],
      finished: [value.finished || false],
      editing: [value.editing !== undefined ? value.editing : true],
    });
  }

  getEducationSummary(index: number): {
    title: string;
    subtitle: string;
    period: string;
  } {
    const edu = this.education.at(index);
    const degree = edu.get('degree')?.value || '';
    const institution = edu.get('institution')?.value || '';
    const location = edu.get('location')?.value || '';

    const startMonth = edu.get('startMonth')?.value;
    const startYear = edu.get('startYear')?.value;
    const endMonth = edu.get('endMonth')?.value;
    const endYear = edu.get('endYear')?.value;
    const current = edu.get('current')?.value;

    let period = '';
    if (startMonth && startYear) {
      period = `de ${this.getMonthName(startMonth)} ${startYear}`;
      if (current) {
        period += ' à ce jour';
      } else if (endMonth && endYear) {
        period += ` à ${this.getMonthName(endMonth)} ${endYear}`;
      }
    }

    return {
      title: degree,
      subtitle: `${institution}${location ? ', ' + location : ''}`,
      period: period,
    };
  }

  getMonthName(month: string): string {
    const months = {
      '01': 'janvier',
      '02': 'février',
      '03': 'mars',
      '04': 'avril',
      '05': 'mai',
      '06': 'juin',
      '07': 'juillet',
      '08': 'août',
      '09': 'septembre',
      '10': 'octobre',
      '11': 'novembre',
      '12': 'décembre',
    };
    return months[month as keyof typeof months] || '';
  }

  // CV Upload functionality
  openUploadModal() {
    this.showUploadModal.set(true);
    this.selectedFile.set(null);
    this.uploadError.set('');
  }

  closeUploadModal() {
    this.showUploadModal.set(false);
    this.selectedFile.set(null);
    this.uploadError.set('');
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (file.size > maxSize) {
        this.uploadError.set('File too large. Maximum size is 10MB.');
        return;
      }

      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
      ];
      if (!allowedTypes.includes(file.type)) {
        this.uploadError.set(
          'Invalid file type. Please select PDF, JPEG, PNG, GIF, or WebP files.'
        );
        return;
      }

      this.selectedFile.set(file);
      this.uploadError.set('');
    }
  }

  async uploadAndAnalyzeCV(): Promise<void> {
    const file = this.selectedFile();
    if (!file) return;

    this.isUploading.set(true);
    this.uploadError.set('');

    try {
      // Enhanced analysis with more comprehensive extraction
      const formData = new FormData();
      formData.append('file', file);
      formData.append(
        'title',
        `AI Analyzed CV - ${new Date().toLocaleDateString()}`
      );
      formData.append('extractImages', 'true'); // Request image extraction
      formData.append('enhancedParsing', 'true'); // Request enhanced parsing

      const response = await fetch(`${environment.apiUrl}/cv/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Upload failed: ${response.statusText}`
        );
      }

      const data = await response.json();

      if (data.cv && data.ocrData) {
        console.log('Extracted CV Data:', data); // Debug log

        // Enhanced auto-fill with comprehensive data mapping
        await this.populateFormFromCVData(
          data.ocrData,
          data.schemaType,
          data.extractedImages
        );
        this.closeUploadModal();

        // Show success notification
        this.successMessage.set(
          'CV analysé et formulaire rempli automatiquement!'
        );
        setTimeout(() => this.successMessage.set(''), 5000);
      } else {
        throw new Error(data.message || 'Aucune donnée extraite du CV');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      this.uploadError.set(
        error.message || "Échec de l'analyse. Veuillez réessayer."
      );
    } finally {
      this.isUploading.set(false);
    }
  }

  private async populateFormFromCVData(
    ocrData: CVOCRData | CustomCVData,
    schemaType: 'legacy' | 'custom',
    extractedImages?: any[]
  ): Promise<void> {
    // Clear existing form arrays
    this.experience.clear();
    this.education.clear();
    this.skills.clear();
    this.languages.clear();
    this.interests.clear();

    // Extract and set profile image if available
    if (extractedImages && extractedImages.length > 0) {
      await this.setProfileImage(extractedImages[0]);
    }

    if (schemaType === 'custom') {
      this.populateFromCustomSchema(ocrData as CustomCVData);
    } else {
      this.populateFromLegacySchema(ocrData as CVOCRData);
    }
  }

  private populateFromCustomSchema(data: CustomCVData): void {
    // Enhanced Personal Information extraction
    const nameParts = data.name
      ? this.parseFullName(data.name)
      : { firstName: '', lastName: '' };
    this.personalInfo.patchValue({
      firstName: nameParts.firstName || '',
      lastName: nameParts.lastName || '',
      headline: data.headline || '',
      email: this.extractBestEmail(data),
      phone: this.extractBestPhone(data),
      address: data.contact?.location?.address || '',
      postalCode: data.contact?.location?.postcode || '',
      city: data.contact?.location?.city || '',
      website: data.contact?.links?.website || '',
      linkedin:
        data.contact?.links?.linkedin || data.contact?.links?.github || '',
    });

    // Enhanced Profile extraction
    this.cvForm.patchValue({
      summary: this.extractBestProfile(data) || '',
      yearsOfExperience: data.years_experience || '',
    });

    // Enhanced Experience extraction
    if (data.experience && Array.isArray(data.experience)) {
      data.experience.forEach((exp, idx) => {
        const dateRange = this.parseAdvancedDateRange(
          exp.start_date,
          exp.end_date
        );

        this.addExperience();
        const index = this.experience.length - 1;

        this.experience.at(index).patchValue({
          title: exp.title || (exp as any).role || '',
          company: exp.company || (exp as any).organization || '',
          location: exp.location || '',
          startMonth: dateRange.startMonth,
          startYear: dateRange.startYear,
          endMonth: dateRange.endMonth,
          endYear: dateRange.endYear,
          current: dateRange.current,
          description: this.extractComprehensiveDescription(exp) || '',
          finished: true,
          editing: false,
        });

        // Populate technologies array
        if (exp.technologies && Array.isArray(exp.technologies)) {
          exp.technologies.forEach((tech: string) => {
            if (tech && tech.trim()) {
              this.addExperienceTechnology(index, tech.trim());
            }
          });
        }
      });
    }

    // Enhanced Education extraction
    if (data.education && Array.isArray(data.education)) {
      data.education.forEach((edu) => {
        const dateRange = this.parseAdvancedDateRange(
          edu.start_date,
          edu.end_date
        );

        this.addEducation();
        const index = this.education.length - 1;

        this.education.at(index).patchValue({
          degree: this.formatEducationDegree(edu),
          institution: edu.institution || '',
          location: edu.location || '',
          startMonth: dateRange.startMonth,
          startYear: dateRange.startYear,
          endMonth: dateRange.endMonth,
          endYear: dateRange.endYear,
          current: dateRange.current,
          description: this.extractEducationDescription(edu),
          finished: true,
          editing: false,
        });
      });
    }

    // Enhanced Skills extraction
    this.extractEnhancedSkills(data);

    // Enhanced Languages extraction
    if (data.languages && Array.isArray(data.languages)) {
      data.languages.forEach((lang) => {
        this.addLanguage();
        const index = this.languages.length - 1;
        this.languages.at(index).patchValue({
          name: lang.language || '',
          level: lang.proficiency || '', //this.mapProficiencyLevel(lang.proficiency),
        });
      });
    }

    // Extract additional sections
    this.extractAdditionalSections(data);
  }

  private populateFromLegacySchema(data: CVOCRData): void {
    // Personal Information
    this.personalInfo.patchValue({
      firstName: this.extractFirstName(data.personalInfo?.fullName),
      lastName: this.extractLastName(data.personalInfo?.fullName),
      email: data.personalInfo?.email || '',
      phone: data.personalInfo?.phone || '',
      address: data.personalInfo?.address || '',
      website: data.personalInfo?.website || '',
      linkedin: data.personalInfo?.linkedin || '',
    });

    // Profile
    this.cvForm.patchValue({
      summary: data.professionalSummary || '',
    });

    // Experience
    if (data.workExperience && Array.isArray(data.workExperience)) {
      data.workExperience.forEach((exp) => {
        this.addExperience();
        const index = this.experience.length - 1;

        const dateRange = this.parseDateRange(exp.duration);

        this.experience.at(index).patchValue({
          title: exp.jobTitle || '',
          company: exp.company || '',
          location: exp.location || '',
          startMonth: dateRange.startMonth,
          startYear: dateRange.startYear,
          endMonth: dateRange.endMonth,
          endYear: dateRange.endYear,
          current: dateRange.current,
          description: this.formatResponsibilities(
            exp.responsibilities,
            exp.achievements
          ),
          finished: true,
          editing: false,
        });

        // Populate technologies array
        if (exp.technologies && Array.isArray(exp.technologies)) {
          exp.technologies.forEach((tech: string) => {
            if (tech && tech.trim()) {
              this.addExperienceTechnology(index, tech.trim());
            }
          });
        }
      });
    }

    // Education
    if (data.education && Array.isArray(data.education)) {
      data.education.forEach((edu) => {
        this.addEducation();
        const index = this.education.length - 1;

        const dateRange = this.parseDateRange(edu.year);

        this.education.at(index).patchValue({
          degree: edu.degree || '',
          institution: edu.institution || '',
          location: edu.location || '',
          startMonth: dateRange.startMonth,
          startYear: dateRange.startYear,
          endMonth: dateRange.endMonth,
          endYear: dateRange.endYear,
          current: false,
          description: edu.honors ? `• ${edu.honors.join('<br>• ')}` : '',
          finished: true,
          editing: false,
        });
      });
    }

    // Skills
    if (data.skills) {
      const allSkills = [
        ...(data.skills.technical || []),
        ...(data.skills.tools || []),
        ...(data.skills.soft || []),
      ];

      allSkills.forEach((skill) => {
        this.addSkill();
        const index = this.skills.length - 1;
        this.skills.at(index).patchValue({
          name: skill,
          level: 'Intermédiaire',
        });
      });
    }

    // Languages
    if (data.languages && Array.isArray(data.languages)) {
      data.languages.forEach((lang) => {
        this.addLanguage();
        const index = this.languages.length - 1;
        this.languages.at(index).patchValue({
          name: lang.language || '',
          level: lang.proficiency || '', //this.mapProficiencyLevel(lang.proficiency),
        });
      });
    }
  }

  // Helper methods
  private formatDescription(description: string | string[]): string {
    if (Array.isArray(description)) {
      return description.map((item) => `• ${item}`).join('<br>');
    }
    return description || '';
  }

  private formatResponsibilities(
    responsibilities: string[],
    achievements?: string[]
  ): string {
    let formatted = '';
    if (responsibilities && responsibilities.length > 0) {
      formatted += responsibilities.map((item) => `• ${item}`).join('<br>');
    }
    if (achievements && achievements.length > 0) {
      if (formatted) formatted += '<br>';
      formatted += achievements.map((item) => `• ${item}`).join('<br>');
    }
    return formatted;
  }

  private extractFirstName(fullName?: string): string {
    if (!fullName) return '';
    return fullName.split(' ')[0] || '';
  }

  private extractLastName(fullName?: string): string {
    if (!fullName) return '';
    const parts = fullName.split(' ');
    return parts.slice(1).join(' ') || '';
  }

  private parseDateRange(dateStr?: string): {
    startMonth: string;
    startYear: string;
    endMonth: string;
    endYear: string;
    current: boolean;
  } {
    if (!dateStr)
      return {
        startMonth: '',
        startYear: '',
        endMonth: '',
        endYear: '',
        current: false,
      };

    // This is a simplified parser - you might want to make it more robust
    const currentIndicators = [
      'present',
      'current',
      'now',
      "aujourd'hui",
      'actuel',
    ];
    const current = currentIndicators.some((indicator) =>
      dateStr.toLowerCase().includes(indicator)
    );

    // Try to extract years
    const yearMatches = dateStr.match(/\b(19|20)\d{2}\b/g);

    if (yearMatches && yearMatches.length >= 1) {
      const startYear = yearMatches[0];
      const endYear = current ? '' : yearMatches[1] || '';

      return {
        startMonth: '',
        startYear,
        endMonth: '',
        endYear,
        current,
      };
    }

    return {
      startMonth: '',
      startYear: '',
      endMonth: '',
      endYear: '',
      current,
    };
  }

  private mapProficiencyLevel(proficiency?: string): string {
    if (!proficiency) return 'B1';

    const level = proficiency.toLowerCase();
    if (level.includes('native') || level.includes('natif')) return 'Natif';
    if (level.includes('fluent') || level.includes('courant')) return 'C2';
    if (level.includes('advanced') || level.includes('avancé')) return 'C1';
    if (level.includes('intermediate') || level.includes('intermédiaire'))
      return 'B2';
    if (level.includes('basic') || level.includes('débutant')) return 'A2';

    return 'B1';
  }

  getFileIcon(type?: string): string {
    if (!type) return '📄';
    if (type.includes('pdf')) return '📄';
    if (type.includes('image')) return '🖼️';
    return '📄';
  }

  formatFileSize(size?: number): string {
    if (!size) return '';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  // Enhanced extraction methods
  private async setProfileImage(imageData: any): Promise<void> {
    try {
      if (imageData && (imageData.base64 || imageData.url)) {
        const imageUrl = imageData.base64 || imageData.url;
        this.personalInfo.patchValue({ photo: imageUrl });
      }
    } catch (error) {
      console.warn('Failed to set profile image:', error);
    }
  }

  private parseFullName(fullName: string): {
    firstName: string;
    lastName: string;
  } {
    if (!fullName) return { firstName: '', lastName: '' };

    const parts = fullName
      .trim()
      .split(' ')
      .filter((part) => part.length > 0);
    if (parts.length === 0) return { firstName: '', lastName: '' };
    if (parts.length === 1) return { firstName: parts[0], lastName: '' };

    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' '),
    };
  }

  private extractBestEmail(data: CustomCVData): string {
    return (
      data.contact?.email ||
      (data.contact?.links as any)?.email ||
      this.extractEmailFromText(JSON.stringify(data)) ||
      ''
    );
  }

  private extractBestPhone(data: CustomCVData): string {
    return (
      data.contact?.phone ||
      this.extractPhoneFromText(JSON.stringify(data)) ||
      ''
    );
  }

  private extractBestProfile(data: CustomCVData): string {
    return (
      data.summary || (data as any).objective || (data as any).description || ''
    );
  }

  private parseAdvancedDateRange(
    startDate?: string,
    endDate?: string
  ): {
    startMonth: string;
    startYear: string;
    endMonth: string;
    endYear: string;
    current: boolean;
  } {
    const defaultResult = {
      startMonth: '',
      startYear: '',
      endMonth: '',
      endYear: '',
      current: false,
    };

    if (!startDate) return defaultResult;

    // Handle various date formats
    const parseDate = (dateStr: string) => {
      if (!dateStr) return { month: '', year: '' };

      // Check for "present", "current", etc.
      const currentIndicators = [
        'present',
        'current',
        'now',
        "aujourd'hui",
        'actuel',
        'ongoing',
      ];
      if (
        currentIndicators.some((indicator) =>
          dateStr.toLowerCase().includes(indicator)
        )
      ) {
        return { month: '', year: '', current: true };
      }

      // Try different date formats
      let year = '',
        month = '';

      // Format: YYYY-MM or YYYY/MM
      const isoMatch = dateStr.match(/(\d{4})[-/](\d{1,2})/);
      if (isoMatch) {
        year = isoMatch[1];
        month = isoMatch[2].padStart(2, '0');
        return { month, year };
      }

      // Format: MM/YYYY or MM-YYYY
      const reverseMatch = dateStr.match(/(\d{1,2})[-/](\d{4})/);
      if (reverseMatch) {
        month = reverseMatch[1].padStart(2, '0');
        year = reverseMatch[2];
        return { month, year };
      }

      // Just year
      const yearMatch = dateStr.match(/\b(19|20)\d{2}\b/);
      if (yearMatch) {
        year = yearMatch[0];
        return { month: '', year };
      }

      // Month name + year (e.g., "January 2020", "Jan 2020")
      const monthYearMatch = dateStr.match(
        /(janvier|february|mars|april|mai|june|juillet|august|septembre|october|novembre|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{4})/i
      );
      if (monthYearMatch) {
        const monthMap: Record<string, string> = {
          janvier: '01',
          jan: '01',
          february: '02',
          feb: '02',
          mars: '03',
          mar: '03',
          april: '04',
          apr: '04',
          mai: '05',
          may: '05',
          june: '06',
          jun: '06',
          juillet: '07',
          jul: '07',
          august: '08',
          aug: '08',
          septembre: '09',
          sep: '09',
          october: '10',
          oct: '10',
          novembre: '11',
          nov: '11',
          december: '12',
          dec: '12',
        };
        month = monthMap[monthYearMatch[1].toLowerCase()] || '';
        year = monthYearMatch[2];
        return { month, year };
      }

      return { month, year };
    };

    const startParsed = parseDate(startDate);
    const endParsed = endDate
      ? parseDate(endDate)
      : { month: '', year: '', current: false };

    return {
      startMonth: startParsed.month || '',
      startYear: startParsed.year || '',
      endMonth: endParsed.month || '',
      endYear: endParsed.year || '',
      current:
        !!(endParsed as any).current ||
        !endDate ||
        endDate.toLowerCase().includes('present'),
    };
  }

  private extractComprehensiveDescription(exp: any): string {
    const description = '';

    // Combine various description fields
    const descFields = [
      exp.description,
      exp.responsibilities,
      exp.achievements,
      exp.highlights,
      exp.tasks,
      exp.accomplishments,
    ];

    const bulletPoints: string[] = [];

    descFields.forEach((field) => {
      if (field) {
        if (Array.isArray(field)) {
          bulletPoints.push(...field.filter((item) => item && item.length > 0));
        } else if (typeof field === 'string' && field.length > 0) {
          // Split by common separators and clean up
          const items = field
            .split(/[•\-*\n]/)
            .filter((item) => item.trim().length > 0);
          bulletPoints.push(...items.map((item) => item.trim()));
        }
      }
    });

    // Format as HTML bullet points
    return bulletPoints.length > 0
      ? bulletPoints.map((point) => `• ${point}`).join('<br>')
      : '';
  }

  private formatEducationDegree(edu: any): string {
    const parts = [
      edu.degree,
      edu.field,
      edu.specialization,
      edu.major,
      edu.minor,
    ].filter((part) => part && part.length > 0);
    return parts.join(' - ');
  }

  private extractLocationFromInstitution(institution?: string): string {
    if (!institution) return '';

    // Extract location from institution name (e.g., "Université de Paris" -> "Paris")
    const locationPatterns = [
      /université de ([^,]+)/i,
      /college of ([^,]+)/i,
      /([^,]+), ([A-Z]{2})/, // City, State
      /([^,]+), (\w+)$/, // City, Country
    ];

    for (const pattern of locationPatterns) {
      const match = institution.match(pattern);
      if (match) {
        return match[1] || match[2] || '';
      }
    }

    return '';
  }

  private extractEducationDescription(edu: any): string {
    const descFields = [
      edu.description,
      edu.coursework,
      edu.activities,
      edu.honors,
      edu.achievements,
      edu.thesis,
      edu.dissertation,
    ];

    const bulletPoints: string[] = [];

    descFields.forEach((field) => {
      if (field) {
        if (Array.isArray(field)) {
          bulletPoints.push(...field.filter((item) => item && item.length > 0));
        } else if (typeof field === 'string' && field.length > 0) {
          bulletPoints.push(field);
        }
      }
    });

    // Add GPA if available
    if (edu.gpa) {
      bulletPoints.push(`GPA: ${edu.gpa}`);
    }

    return bulletPoints.length > 0
      ? bulletPoints.map((point) => `• ${point}`).join('<br>')
      : '';
  }

  private extractEnhancedSkills(data: CustomCVData): void {
    if (!data.skills) return;

    const skillCategories = [
      { category: 'Cloud', skills: data.skills.cloud || [] },
      { category: 'Platforms & OS', skills: data.skills.platforms_os || [] },
      { category: 'Containers', skills: data.skills.containers || [] },
      { category: 'Orchestration', skills: data.skills.orchestration || [] },
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
      {
        category: 'Langages de programmation',
        skills: (data.skills as any).technical || [],
      },
    ];

    skillCategories.forEach(({ category, skills }) => {
      if (skills && skills.length > 0) {
        // Create a new skill category
        this.addSkillCategory(category);
        const categoryIndex = this.skills.length - 1;

        // Add all skills to this category
        skills.forEach((skill: any) => {
          if (skill && skill.trim().length > 0) {
            // Determine skill level based on context or category
            const level = this.determineSkillLevel(skill, category);

            // Add skill to the category
            this.addSkillToCategory(categoryIndex, skill.trim(), level);
          }
        });
      }
    });
  }

  private determineSkillLevel(skill: string, category: string): string {
    // Simple heuristics for skill level determination
    const advancedKeywords = [
      'expert',
      'advanced',
      'senior',
      'lead',
      'architect',
    ];
    const beginnerKeywords = ['basic', 'beginner', 'learning', 'introduction'];

    const skillLower = skill.toLowerCase();

    if (advancedKeywords.some((keyword) => skillLower.includes(keyword))) {
      return 'Expert';
    }

    if (beginnerKeywords.some((keyword) => skillLower.includes(keyword))) {
      return 'Débutant';
    }

    // Category-based defaults
    const advancedCategories = ['Orchestration', 'IaC', 'Security'];
    if (advancedCategories.includes(category)) {
      return 'Avancé';
    }

    return 'Intermédiaire';
  }

  private extractAdditionalSections(data: CustomCVData): void {
    // Extract interests/hobbies
    if ((data as any).awards && Array.isArray((data as any).awards)) {
      (data as any).awards.forEach((award: any) => {
        this.addInterest();
        const index = this.interests.length - 1;
        this.interests.at(index).patchValue({
          name:
            typeof award === 'string'
              ? award
              : `${award.name || award.title || 'Award'}`,
        });
      });
    }

    // Extract affiliations as interests
    if (data.affiliations && Array.isArray(data.affiliations)) {
      data.affiliations.forEach((affiliation) => {
        this.addInterest();
        const index = this.interests.length - 1;
        this.interests.at(index).patchValue({
          name: affiliation,
        });
      });
    }
  }

  private extractEmailFromText(text: string): string {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const matches = text.match(emailRegex);
    return matches ? matches[0] : '';
  }

  private extractPhoneFromText(text: string): string {
    const phoneRegex =
      /(?:\+33\s?|0)[1-9](?:[.\s-]?\d{2}){4}|(?:\+1\s?)?(?:\([0-9]{3}\)|[0-9]{3})[\s.-]?[0-9]{3}[\s.-]?[0-9]{4}/g;
    const matches = text.match(phoneRegex);
    return matches ? matches[0] : '';
  }

  // Template methods
  selectTemplate(templateId: string): void {
    this.selectedTemplate.set(templateId);
  }

  getCurrentTemplate(): CVTemplate {
    return (
      this.availableTemplates.find((t) => t.id === this.selectedTemplate()) ||
      this.availableTemplates[0]
    );
  }

  // === CV LIST MANAGEMENT METHODS ===

  async loadCVs() {
    this.isLoading.set(true);
    this.error.set('');

    try {
      // Since recentUploads is a signal, we can directly access its value
      const cvs = this.cvService.recentUploads();
      this.cvs.set(cvs);
      this.isLoading.set(false);
    } catch (error: any) {
      console.error('Error loading CVs:', error);
      this.error.set('Erreur lors du chargement des CVs');
      this.isLoading.set(false);
    }
  }

  createNewCV() {
    this.currentCvId.set(null);
    this.currentView.set('form');
    this.cvForm.reset();
    this.initializeDefaultData();
  }

  async editCV(cv: CV) {
    this.currentCvId.set(cv.id);
    this.currentView.set('form');
    await this.loadCVForEditing(cv.id);
  }

  async loadCVForEditing(cvId: string) {
    try {
      // This would typically load the CV data from the API
      // For now, we'll just initialize with default data
      this.initializeDefaultData();
    } catch (error) {
      console.error('Error loading CV for editing:', error);
      this.error.set('Erreur lors du chargement du CV');
    }
  }

  viewCV(cv: CV) {
    this.cvToView.set(cv);
    this.showViewModal.set(true);
  }

  async downloadCV(cv: CV) {
    try {
      // Use the existing exportWord functionality but with CV data
      await this.exportCVToWord(cv);
    } catch (error) {
      console.error('Error downloading CV:', error);
      this.error.set('Erreur lors du téléchargement du CV');
    }
  }

  confirmDeleteCV(cv: CV) {
    this.cvToDelete.set(cv);
    this.showDeleteModal.set(true);
  }

  async deleteCV() {
    const cv = this.cvToDelete();
    if (!cv) return;

    this.isLoading.set(true);
    try {
      await this.cvService.deleteCVById(cv.id).toPromise();
      this.showDeleteModal.set(false);
      this.cvToDelete.set(null);
      this.successMessage.set('CV supprimé avec succès');
      setTimeout(() => this.successMessage.set(''), 5000);
      await this.loadCVs(); // Reload the list
    } catch (error) {
      console.error('Error deleting CV:', error);
      this.error.set('Erreur lors de la suppression du CV');
    } finally {
      this.isLoading.set(false);
    }
  }

  cancelDelete() {
    this.showDeleteModal.set(false);
    this.cvToDelete.set(null);
  }

  closeViewModal() {
    this.showViewModal.set(false);
    this.cvToView.set(null);
  }

  showListView() {
    this.currentView.set('list');
    this.currentCvId.set(null);
    this.loadCVs();
  }

  // Search and filter methods
  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
    this.currentPage.set(1); // Reset to first page
  }

  onStatusFilterChange(status: any) {
    this.selectedStatus.set(status);
    this.currentPage.set(1);
  }

  onTemplateFilterChange(templateId: string) {
    this.selectedTemplateFilter.set(templateId);
    this.currentPage.set(1);
  }

  // Sorting methods
  onSort(field: SortField) {
    if (this.sortField() === field) {
      // Toggle direction if same field
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default direction
      this.sortField.set(field);
      this.sortDirection.set('desc');
    }
    this.currentPage.set(1);
  }

  // Pagination methods
  goToPage(page: number) {
    this.currentPage.set(page);
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  previousPage() {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  // Utility methods
  getStatusLabel(status: any): string {
    switch (status) {
      case 'PENDING':
        return 'En attente';
      case 'PROCESSING':
        return 'En cours';
      case 'COMPLETED':
        return 'Terminé';
      case 'FAILED':
        return 'Échec';
      default:
        return status;
    }
  }

  getStatusColor(status: any): string {
    switch (status) {
      case 'PENDING':
        return 'text-yellow-600';
      case 'PROCESSING':
        return 'text-blue-600';
      case 'COMPLETED':
        return 'text-green-600';
      case 'FAILED':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getTemplateName(templateId?: string): string {
    if (!templateId) return 'Défaut';
    const template = this.availableTemplates.find((t) => t.id === templateId);
    return template ? template.name : templateId;
  }

  async exportCVToWord(cv: CV) {
    // This would export the specific CV's data to Word
    // For now, we'll use the current form data
    return this.exportWord();
  }

  async saveCV() {
    if (this.cvForm.invalid) {
      this.error.set('Veuillez remplir tous les champs requis');
      return;
    }

    this.isLoading.set(true);
    try {
      const formData = this.cvForm.value;

      if (this.isEditing()) {
        // Update existing CV
        const cvId = this.currentCvId();
        if (cvId) {
          // This would typically call cvService.updateCV(cvId, formData)
          // For now, just show success message
          this.successMessage.set('CV mis à jour avec succès');
        }
      } else {
        // Create new CV
        // This would typically call cvService.createCV(formData)
        // For now, just show success message
        this.successMessage.set('CV créé avec succès');
      }

      setTimeout(() => this.successMessage.set(''), 5000);
      // After saving, go back to list view
      setTimeout(() => this.showListView(), 2000);
    } catch (error: any) {
      console.error('Error saving CV:', error);
      this.error.set('Erreur lors de la sauvegarde du CV');
    } finally {
      this.isLoading.set(false);
    }
  }
}
