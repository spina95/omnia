import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderService } from '../../services/page-header.service';
import { PageHeaderActionsService } from '../../services/page-header-actions.service';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="headerService.header().title"
      class="bg-sidebar-light dark:bg-sidebar border-b border-sidebar-border-light dark:border-sidebar-border px-4 sm:px-6 lg:px-8 h-16 transition-colors duration-200"
    >
      <div class="max-w-7xl mx-auto h-full flex items-center justify-between gap-4">
        <h1 class="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white truncate transition-colors duration-200">
          {{ headerService.header().title }}
        </h1>
        <div class="flex items-center gap-3 flex-shrink-0">
          <ng-container *ngIf="actionsService.actions()">
            <ng-container *ngTemplateOutlet="actionsService.actions()!"></ng-container>
          </ng-container>
        </div>
      </div>
    </div>
  `,
})
export class PageHeaderComponent {
  headerService = inject(PageHeaderService);
  actionsService = inject(PageHeaderActionsService);
}
