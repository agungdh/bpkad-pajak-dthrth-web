import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { SampleCrudComponent } from './pages/sample-crud/sample-crud';

export const routes: Routes = [
    {
        path: '',
        component: LayoutComponent,
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', component: DashboardComponent },
            { path: 'sample-crud', component: SampleCrudComponent },
        ],
    },
];
