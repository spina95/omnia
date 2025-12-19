import { Injectable, signal } from '@angular/core';

export interface PageHeader {
  title: string;
}

@Injectable({
  providedIn: 'root',
})
export class PageHeaderService {
  private headerSignal = signal<PageHeader>({ title: '' });

  readonly header = this.headerSignal.asReadonly();

  setHeader(title: string) {
    this.headerSignal.set({ title });
  }

  clearHeader() {
    this.headerSignal.set({ title: '' });
  }
}
