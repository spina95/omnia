import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./features/layout/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent
      ),
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./features/home/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'outcomes',
        loadComponent: () =>
          import('./features/finance/outcomes/outcomes').then((m) => m.OutcomesComponent),
      },
      {
        path: 'incomes',
        loadComponent: () =>
          import('./features/finance/incomes/incomes').then((m) => m.IncomesComponent),
      },
      {
        path: 'budgets',
        loadComponent: () =>
          import('./features/finance/budgets/budgets').then((m) => m.BudgetsComponent),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
