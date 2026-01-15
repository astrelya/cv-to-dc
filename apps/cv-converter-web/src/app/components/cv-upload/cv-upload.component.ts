import { Component, OnInit, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { CvService } from '../../services/cv.service';
import { CV, CVOCRData, CustomCVData } from '../../models/cv.model';

@Component({
  selector: 'app-cv-upload',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cv-upload.component.html',
  styleUrls: ['./cv-upload.component.scss'],
})
export class CvUploadComponent implements OnInit {
  private fb = inject(FormBuilder);
  private cvService = inject(CvService);

  // Reactive signals
  selectedFile = signal<File | null>(null);
  uploadForm: FormGroup;
  errorMessage = signal('');
  lastUploadResult = signal<{
    cv: CV;
    ocrData: CVOCRData | CustomCVData;
    schemaType: 'legacy' | 'custom';
  } | null>(null);
  recentCVs = signal<CV[]>([]);

  // Upload progress signals from service
  isUploading = this.cvService.isUploading;
  uploadProgress = this.cvService.uploadProgress;

  constructor() {
    this.uploadForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
    });
  }

  ngOnInit(): void {
    this.loadRecentCVs();
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = target.files;

    if (files && files.length > 0) {
      const file = files[0];

      // Validate file type
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
      ];
      if (!allowedTypes.includes(file.type)) {
        this.errorMessage.set(
          'Please select a valid image file (JPEG, PNG, GIF, WebP) or PDF document.'
        );
        return;
      }

      // Validate file size (10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        this.errorMessage.set('File size must be less than 10MB.');
        return;
      }

      this.selectedFile.set(file);
      this.errorMessage.set('');

      // Auto-populate title with filename
      if (!this.uploadForm.get('title')?.value) {
        const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
        this.uploadForm.patchValue({ title: fileName });
      }
    }
  }

  onSubmit(): void {
    if (this.uploadForm.valid && this.selectedFile()) {
      this.errorMessage.set('');
      const title = this.uploadForm.value.title!;
      const file = this.selectedFile()!;

      // Simple HTTP call without progress tracking to avoid type issues
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);

      // Make simple HTTP POST request
      fetch(`${environment.apiUrl}/cv/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.cv && data.ocrData) {
            this.lastUploadResult.set({
              cv: data.cv,
              ocrData: data.ocrData,
              schemaType: data.schemaType,
            });
            this.selectedFile.set(null);
            this.uploadForm.reset();
            this.loadRecentCVs();
          } else {
            throw new Error(data.message || 'Upload failed');
          }
        })
        .catch((error) => {
          console.error('Upload error:', error);
          this.errorMessage.set(
            error.message || 'Upload failed. Please try again.'
          );
        });
    }
  }

  private loadRecentCVs(): void {
    // Simple fetch to get user CVs
    fetch(`${environment.apiUrl}/cv`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) {
          this.recentCVs.set(data.slice(0, 5));
        }
      })
      .catch((error) => {
        console.warn('Failed to load recent CVs:', error);
      });
  }

  // Word Document Generation
  generateWordDocument(): void {
    console.log('🔄 Generate Word Document button clicked');

    const result = this.lastUploadResult();
    console.log('📊 Current upload result:', result);

    if (!result?.cv?.id) {
      console.error('❌ No CV data available for document generation');
      this.errorMessage.set('No CV data available for document generation');
      return;
    }

    const fileName = `${result.cv.title.replace(/\s+/g, '_')}_CV`;
    console.log('📝 Generated filename:', fileName);
    console.log('🆔 CV ID for generation:', result.cv.id);
    console.log('📄 Template name: cv-template.docx');

    console.log('🚀 Calling document generation API...');
    this.cvService
      .generateWordDocument(result.cv.id, 'cv-template.docx', fileName)
      .subscribe({
        next: (blob) => {
          console.log('✅ Word document generated successfully');
          console.log('📦 Blob size:', blob.size, 'bytes');
          console.log('📦 Blob type:', blob.type);

          // Create download link
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${fileName}.docx`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);

          console.log('💾 File download initiated:', `${fileName}.docx`);
        },
        error: async (error) => {
          console.error('❌ Error generating Word document:', error);
          console.error('📊 Error details:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            url: error.url,
            errorBody: error.error,
            errorType: typeof error.error,
            isBlob: error.error instanceof Blob,
            blobType: error.error instanceof Blob ? error.error.type : 'N/A',
          });

          let backendErrorMessage = '';

          // Try to extract backend error message if it's a JSON blob
          if (
            error.error instanceof Blob &&
            error.error.type === 'application/json'
          ) {
            try {
              const errorText = await error.error.text();
              const errorData = JSON.parse(errorText);
              backendErrorMessage = errorData.message || '';
              console.error('📊 Backend error message:', backendErrorMessage);
            } catch (e) {
              console.error('❌ Could not parse error blob:', e);
            }
          }

          if (error.status === 400) {
            const errorMsg = backendErrorMessage
              ? `Document generation failed: ${backendErrorMessage}`
              : 'Bad request. Please check if CV data exists and template is valid.';
            console.error('💬 User error message:', errorMsg);
            this.errorMessage.set(errorMsg);
          } else if (error.status === 401) {
            const errorMsg = 'Authentication failed. Please login again.';
            console.error('🔐 Auth error:', errorMsg);
            this.errorMessage.set(errorMsg);
          } else if (error.status === 404) {
            const errorMsg = backendErrorMessage
              ? `Not found: ${backendErrorMessage}`
              : 'Template not found. Please ensure cv-template.docx exists.';
            console.error('📄 Template error:', errorMsg);
            this.errorMessage.set(errorMsg);
          } else if (error.status === 0) {
            const errorMsg =
              'Cannot connect to server. Please ensure the backend is running on http://localhost:3000';
            console.error('🌐 Connection error:', errorMsg);
            this.errorMessage.set(errorMsg);
          } else {
            const errorMsg = backendErrorMessage
              ? `Failed to generate document: ${backendErrorMessage}`
              : 'Failed to generate Word document. Please try again.';
            console.error('🔄 Generic error:', errorMsg);
            this.errorMessage.set(errorMsg);
          }
        },
      });
  }

  // Helper methods for template
  isCustomSchema(data: CVOCRData | CustomCVData): data is CustomCVData {
    return 'name' in data && 'headline' in data && 'years_experience' in data;
  }

  isLegacySchema(data: CVOCRData | CustomCVData): data is CVOCRData {
    return (
      'personalInfo' in data &&
      'workExperience' in data &&
      'extractedText' in data
    );
  }

  getFileIcon(mimeType?: string): string {
    if (mimeType?.includes('pdf')) return '📄';
    if (mimeType?.includes('image')) return '🖼️';
    return '📁';
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
}
