import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

interface MenuItem {
    label: string;
    icon: string;
    route: string;
}

@Component({
    selector: 'app-layout',
    imports: [RouterOutlet, RouterLink, RouterLinkActive, DrawerModule, ButtonModule, RippleModule],
    templateUrl: './layout.html',
    styleUrl: './layout.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent {
    protected readonly sidebarVisible = signal(false);

    protected readonly menuItems: MenuItem[] = [
        { label: 'Dashboard', icon: 'pi pi-home', route: '/dashboard' },
        { label: 'Data Master', icon: 'pi pi-database', route: '/sample-crud' },
        { label: 'Laporan', icon: 'pi pi-chart-bar', route: '/dashboard' },
        { label: 'Pengaturan', icon: 'pi pi-cog', route: '/dashboard' },
    ];

    toggleSidebar(): void {
        this.sidebarVisible.update((v) => !v);
    }

    closeSidebar(): void {
        this.sidebarVisible.set(false);
    }
}
