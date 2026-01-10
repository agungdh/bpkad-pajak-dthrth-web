import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CardModule } from 'primeng/card';

interface StatCard {
    title: string;
    value: string;
    icon: string;
    trend: string;
    trendUp: boolean;
}

@Component({
    selector: 'app-dashboard',
    imports: [CardModule],
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
    protected readonly stats: StatCard[] = [
        { title: 'Total Wajib Pajak', value: '12,847', icon: 'pi pi-users', trend: '+12%', trendUp: true },
        { title: 'Pendapatan Bulan Ini', value: 'Rp 2.4M', icon: 'pi pi-wallet', trend: '+8%', trendUp: true },
        { title: 'Tunggakan', value: 'Rp 890Jt', icon: 'pi pi-exclamation-circle', trend: '-5%', trendUp: false },
        { title: 'Transaksi Hari Ini', value: '156', icon: 'pi pi-receipt', trend: '+23%', trendUp: true },
    ];
}
