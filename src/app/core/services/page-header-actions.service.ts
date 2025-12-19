import { Injectable, signal, TemplateRef } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PageHeaderActionsService {
  private actionsTemplate = signal<TemplateRef<any> | null>(null);

  readonly actions = this.actionsTemplate.asReadonly();

  setActions(template: TemplateRef<any> | null) {
    this.actionsTemplate.set(template);
  }

  clearActions() {
    this.actionsTemplate.set(null);
  }
}
