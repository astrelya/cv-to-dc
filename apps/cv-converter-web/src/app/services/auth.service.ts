import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap, catchError, throwError } from 'rxjs';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;

  // Signals for reactive state management
  public isAuthenticated = signal<boolean>(false);
  public currentUser = signal<User | null>(null);
  public isLoading = signal<boolean>(false);

  constructor() {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = this.getToken();
    if (token) {
      this.isAuthenticated.set(true);
      this.loadUserProfile();
    }
  }

  register(registerData: RegisterRequest): Observable<AuthResponse> {
    this.isLoading.set(true);
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/register`, registerData)
      .pipe(
        tap((response) => {
          this.handleAuthResponse(response);
          this.isLoading.set(false);
        }),
        catchError((error) => {
          this.isLoading.set(false);
          return throwError(() => error);
        })
      );
  }

  login(loginData: LoginRequest): Observable<AuthResponse> {
    this.isLoading.set(true);
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/login`, loginData)
      .pipe(
        tap((response) => {
          this.handleAuthResponse(response);
          this.isLoading.set(false);
        }),
        catchError((error) => {
          this.isLoading.set(false);
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    localStorage.removeItem('token');
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  private handleAuthResponse(response: AuthResponse): void {
    localStorage.setItem('token', response.access_token);
    this.isAuthenticated.set(true);
    this.currentUser.set(response.user);
    this.router.navigate(['/dashboard']);
  }

  private loadUserProfile(): void {
    this.http
      .get<User>(`${this.apiUrl}/auth/profile`)
      .pipe(
        tap((user) => {
          this.currentUser.set(user);
        }),
        catchError(() => {
          this.logout();
          return throwError(() => 'Failed to load user profile');
        })
      )
      .subscribe();
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getAuthHeaders() {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}
