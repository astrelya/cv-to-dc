import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./components/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'my-cvs',
        pathMatch: 'full',
      } /*
      {
        path: 'cv-upload',
        loadComponent: () =>
          import('./components/cv-upload/cv-upload.component').then(
            (m) => m.CvUploadComponent
          ),
      },*/,
      {
        path: 'my-cvs',
        loadComponent: () =>
          import('./components/my-cvs/my-cvs.component').then(
            (m) => m.MyCvsComponent
          ),
      } /*
      {
        path: 'profile',
        loadComponent: () =>
          import('./components/cv-upload/cv-upload.component').then(
            (m) => m.CvUploadComponent
          ), // Placeholder for now
      },*/,
    ],
  },
  {
    path: '**',
    redirectTo: '/login',
  },
];
