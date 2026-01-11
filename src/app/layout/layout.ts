import { Component, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { MenuModule } from 'primeng/menu';
import { AuthService } from '../services/auth.service';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, DrawerModule, ButtonModule, RippleModule, MenuModule],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent {
  protected readonly authService = inject(AuthService);

  protected readonly sidebarVisible = signal(false);
  protected readonly loggingOut = signal(false);

  protected readonly menuItems: MenuItem[] = [
    { label: 'Dashboard', icon: 'pi pi-home', route: '/dashboard' },
    { label: 'Data SKPD', icon: 'pi pi-building', route: '/skpd' },
    { label: 'Kode Pajak', icon: 'pi pi-tag', route: '/kode-pajak' },
    { label: 'Laporan', icon: 'pi pi-chart-bar', route: '/dashboard' },
    { label: 'Pengaturan', icon: 'pi pi-cog', route: '/dashboard' },
  ];

  toggleSidebar(): void {
    this.sidebarVisible.update((v) => !v);
  }

  closeSidebar(): void {
    this.sidebarVisible.set(false);
  }

  logout(): void {
    if (this.loggingOut()) return;

    this.loggingOut.set(true);
    this.authService.logout().subscribe({
      next: () => {
        this.authService.redirectToLogin();
      },
      error: () => {
        // Even on error, clear auth and redirect
        this.authService.redirectToLogin();
      },
    });
  }
}
