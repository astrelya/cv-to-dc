import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h1>Create Account</h1>
          <p>Join CV Converter and manage your documents</p>
        </div>

        <form
          [formGroup]="registerForm"
          (ngSubmit)="onSubmit()"
          class="auth-form"
        >
          <div class="form-group">
            <label for="name">Full Name</label>
            <input
              type="text"
              id="name"
              formControlName="name"
              class="form-input"
              [class.error]="isFieldInvalid('name')"
              placeholder="Enter your full name"
            />
            @if (isFieldInvalid('name')) {
            <div class="error-message">
              Name must be at least 2 characters long
            </div>
            }
          </div>

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
              @if (registerForm.get('email')?.errors?.['required']) { Email is
              required } @if (registerForm.get('email')?.errors?.['email']) {
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
              placeholder="Create a password (min 6 characters)"
            />
            @if (isFieldInvalid('password')) {
            <div class="error-message">
              Password must be at least 6 characters long
            </div>
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
            [disabled]="registerForm.invalid || authService.isLoading()"
          >
            @if (authService.isLoading()) {
            <span class="loading-spinner"></span>
            Creating account... } @else { Create Account }
          </button>
        </form>

        <div class="auth-footer">
          <p>
            Already have an account?
            <a routerLink="/login" class="auth-link">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  public authService = inject(AuthService);

  public errorMessage = signal<string>('');

  public registerForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.errorMessage.set('');
      const registerData = this.registerForm.value as {
        name: string;
        email: string;
        password: string;
      };

      this.authService.register(registerData).subscribe({
        error: (error) => {
          console.error('Registration error:', error);
          this.errorMessage.set(
            error.error?.message || 'Registration failed. Please try again.'
          );
        },
      });
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}
