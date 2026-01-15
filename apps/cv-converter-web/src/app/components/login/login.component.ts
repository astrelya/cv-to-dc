import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h1>Welcome Back</h1>
          <p>Sign in to your CV Converter account</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label for="email">Email Address</label>
            <input
              type="email"
              id="email"
              formControlName="email"
              class="form-input"
              [class.error]="isFieldInvalid('email')"
              placeholder="Enter your email"
            />
            @if (isFieldInvalid('email')) {
            <div class="error-message">
              @if (loginForm.get('email')?.errors?.['required']) { Email is
              required } @if (loginForm.get('email')?.errors?.['email']) {
              Please enter a valid email }
            </div>
            }
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              type="password"
              id="password"
              formControlName="password"
              class="form-input"
              [class.error]="isFieldInvalid('password')"
              placeholder="Enter your password"
            />
            @if (isFieldInvalid('password')) {
            <div class="error-message">Password is required</div>
            }
          </div>

          @if (errorMessage()) {
          <div class="error-alert">
            {{ errorMessage() }}
          </div>
          }

          <button
            type="submit"
            class="auth-button primary"
            [disabled]="loginForm.invalid || authService.isLoading()"
          >
            @if (authService.isLoading()) {
            <span class="loading-spinner"></span>
            Signing in... } @else { Sign In }
          </button>
        </form>

        <div class="auth-footer">
          <p>
            Don't have an account?
            <a routerLink="/register" class="auth-link">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  public authService = inject(AuthService);

  public errorMessage = signal<string>('');

  public loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.errorMessage.set('');
      const loginData = this.loginForm.value as {
        email: string;
        password: string;
      };

      this.authService.login(loginData).subscribe({
        error: (error) => {
          console.error('Login error:', error);
          this.errorMessage.set(
            error.error?.message ||
              'Login failed. Please check your credentials.'
          );
        },
      });
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}
