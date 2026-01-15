import { Injectable, inject, signal } from '@angular/core';
import {
  HttpClient,
  HttpEventType,
  HttpEvent,
  HttpHeaders,
  HttpResponse,
} from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { map, tap, catchError, switchMap } from 'rxjs/operators';
import { CV, CVUploadResponse } from '../models/cv.model';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CvService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.apiUrl + '/cv';

  // Reactive signals for state management
  uploadProgress = signal<number>(0);
  isUploading = signal<boolean>(false);
  recentUploads = signal<CV[]>([]);

  constructor() {
    // Load recent uploads on service initialization
    this.getUserCVs().subscribe({
      next: (cvs) => this.recentUploads.set(cvs.slice(0, 5)),
      error: (error) => console.error('Failed to load recent CVs:', error),
    });
  }

  uploadCV(file: File, title: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);

    this.isUploading.set(true);
    this.uploadProgress.set(0);

    const token = localStorage.getItem('token');
    const headers = token
      ? new HttpHeaders().set('Authorization', `Bearer ${token}`)
      : undefined;

    return this.http
      .post(`${this.apiUrl}/upload`, formData, {
        headers,
        reportProgress: true,
        observe: 'events',
      })
      .pipe(
        map((event: HttpEvent<any>) => {
          switch (event.type) {
            case HttpEventType.UploadProgress:
              if (event.total) {
                const progress = Math.round((100 * event.loaded) / event.total);
                this.uploadProgress.set(progress);
              }
              return { type: event.type, progress: this.uploadProgress() };
            case HttpEventType.Response: {
              this.isUploading.set(false);
              this.uploadProgress.set(100);

              const response = event.body as CVUploadResponse;

              // Add to recent uploads
              this.recentUploads.update((current: CV[]) => [
                response.cv,
                ...current.slice(0, 4),
              ]);

              return {
                type: event.type,
                body: response,
                schemaType: response.schemaType,
              };
            }
            default:
              return event;
          }
        }),
        tap({
          error: () => {
            this.isUploading.set(false);
            this.uploadProgress.set(0);
          },
        })
      );
  }

  getUserCVs(): Observable<CV[]> {
    const token = localStorage.getItem('token');
    const headers = token
      ? new HttpHeaders().set('Authorization', `Bearer ${token}`)
      : undefined;

    return this.http
      .get<CV[]>(this.apiUrl, { headers })
      .pipe(tap((cvs: CV[]) => this.recentUploads.set(cvs.slice(0, 5))));
  }

  getCVById(id: string): Observable<CV> {
    const token = localStorage.getItem('token');
    const headers = token
      ? new HttpHeaders().set('Authorization', `Bearer ${token}`)
      : undefined;

    return this.http.get<CV>(`${this.apiUrl}/${id}`, { headers });
  }

  deleteCVById(id: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = token
      ? new HttpHeaders().set('Authorization', `Bearer ${token}`)
      : undefined;

    return this.http.delete(`${this.apiUrl}/${id}`, { headers }).pipe(
      tap(() => {
        // Remove from recent uploads
        this.recentUploads.update((current: CV[]) =>
          current.filter((cv: CV) => cv.id !== id)
        );
      })
    );
  }

  generateWordDocument(
    cvId: string,
    templateName = 'cv-template.docx',
    outputName?: string
  ): Observable<Blob> {
    console.log('🔧 CV Service: generateWordDocument called');
    console.log('📊 Parameters:', { cvId, templateName, outputName });

    const token = localStorage.getItem('token');
    console.log('🔐 Auth token exists:', !!token);
    console.log(
      '🔐 Auth token preview:',
      token ? `${token.substring(0, 20)}...` : 'null'
    );

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    const body = {
      templateName,
      cvId,
      outputName: outputName || `CV_${Date.now()}`,
    };

    console.log('📤 Request body:', body);
    console.log('📤 Request headers:', headers);
    console.log(
      '📤 API URL: http://localhost:3000/api/documents/generate-from-cv'
    );

    return this.http
      .post(`http://localhost:3000/api/documents/generate-from-cv`, body, {
        headers,
        responseType: 'blob',
        observe: 'response',
      })
      .pipe(
        tap({
          next: (response) => {
            console.log('✅ CV Service: HTTP request successful');
            console.log('📊 Response status:', response.status);
            console.log('📊 Response headers:', response.headers);
          },
          error: (error) => {
            console.error('❌ CV Service: HTTP request failed');
            console.error('📊 HTTP Error:', error);

            // Try to extract error message from blob if it's JSON
            if (
              error.error instanceof Blob &&
              error.error.type === 'application/json'
            ) {
              error.error.text().then((text: string) => {
                try {
                  const errorData = JSON.parse(text);
                  console.error('📊 Backend error message:', errorData.message);
                  error.backendMessage = errorData.message;
                } catch (e) {
                  console.error('📊 Could not parse error blob as JSON');
                }
              });
            }
          },
        }),
        catchError((error: any) => {
          console.error('🔍 Enhanced error handling activated');
          return throwError(() => error);
        }),
        map((response: HttpResponse<Blob>) => response.body!)
      );
  }

  // Get available templates
  getAvailableTemplates(): Observable<{ templates: string[] }> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    });

    return this.http.get<{ templates: string[] }>(
      `http://localhost:3000/api/documents/templates`,
      { headers }
    );
  }

  // Helper method to determine if data is using the custom schema
  isCustomSchema(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      'name' in data &&
      'headline' in data &&
      'years_experience' in data
    );
  }

  // Helper method to determine if data is using the legacy schema
  isLegacySchema(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      'personalInfo' in data &&
      'workExperience' in data &&
      'extractedText' in data
    );
  }
}
