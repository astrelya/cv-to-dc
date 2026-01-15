import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  template: `
    <div class="dashboard-layout">
      <!-- Sidebar -->
      <nav class="sidebar">
        <div class="sidebar-header">
          <h1 class="logo">CV Converter</h1>
        </div>

        <div class="sidebar-nav">
          <a
            routerLink="/dashboard/my-cvs"
            routerLinkActive="active"
            class="nav-item"
          >
            <span class="nav-icon">📁</span>
            <span class="nav-text">My CVs</span>
          </a>
        </div>

        <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-avatar">
              {{
                (authService.currentUser()?.name || 'U').charAt(0).toUpperCase()
              }}
            </div>
            <div class="user-details">
              <div class="user-name">
                {{ authService.currentUser()?.name || 'User' }}
              </div>
              <div class="user-email">
                {{ authService.currentUser()?.email }}
              </div>
            </div>
          </div>
          <button (click)="logout()" class="logout-button">
            <span class="nav-icon">🚪</span>
            Logout
          </button>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  public authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
  }
}
