import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { SkpdComponent } from './pages/skpd/skpd';
import { KodePajakComponent } from './pages/kode-pajak/kode-pajak';
import { UsersComponent } from './pages/users/users';
import { LoginComponent } from './pages/login/login';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'skpd', component: SkpdComponent },
      { path: 'kode-pajak', component: KodePajakComponent },
      { path: 'users', component: UsersComponent },
    ],
  },
];
