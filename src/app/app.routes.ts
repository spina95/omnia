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
      {
        path: 'investments',
        loadComponent: () =>
          import('./features/finance/investments/investments.component').then(
            (m) => m.InvestmentsComponent
          ),
      },
      {
        path: 'travel-map',
        loadComponent: () =>
          import('./features/finance/travel-map/travel-map.component').then(
            (m) => m.TravelMapComponent
          ),
      },
      {
        path: 'documents',
        loadComponent: () =>
          import('./features/documents/documents.component').then((m) => m.DocumentsComponent),
      },
      {
        path: 'videos',
        loadComponent: () =>
          import('./features/videos/videos.component').then((m) => m.VideosComponent),
      },
      {
        path: 'todos',
        loadComponent: () =>
          import('./features/todos/todos.component').then((m) => m.TodosComponent),
      },
      {
        path: 'todos/:id',
        loadComponent: () =>
          import('./features/todos/todo-detail/todo-detail.component').then(
            (m) => m.TodoDetailComponent
          ),
      },
      {
        path: 'planner',
        redirectTo: 'planner/today',
        pathMatch: 'full',
      },
      {
        path: 'planner/today',
        loadComponent: () =>
          import('./features/planner/day-view/day-view.component').then((m) => m.DayViewComponent),
      },
      {
        path: 'planner/day/:date',
        loadComponent: () =>
          import('./features/planner/day-view/day-view.component').then((m) => m.DayViewComponent),
      },
      {
        path: 'planner/search',
        loadComponent: () =>
          import('./features/planner/search-view/search-view.component').then(
            (m) => m.SearchViewComponent
          ),
      },
      {
        path: 'planner/journal/:date',
        loadComponent: () =>
          import('./features/planner/journal-full-view/journal-full-view.component').then(
            (m) => m.JournalFullViewComponent
          ),
      },
      {
        path: 'planner/mood-calendar',
        loadComponent: () =>
          import('./features/planner/mood-calendar/mood-calendar.component').then(
            (m) => m.MoodCalendarComponent
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
