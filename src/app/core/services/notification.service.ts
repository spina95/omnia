import { Injectable, signal, Signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  title?: string;
  description?: string;
  timeout?: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private _notifications = signal<Notification[]>([]);

  get notifications(): Signal<Notification[]> {
    return this._notifications;
  }

  private add(notification: Notification) {
    this._notifications.update((list) => [...list, notification]);
    const timeout = notification.timeout ?? 3000;
    if (timeout > 0) {
      setTimeout(() => this.dismiss(notification.id), timeout);
    }
  }

  success(message: string, timeout?: number, title?: string, description?: string) {
    this.add({ id: this.uid(), type: 'success', message, timeout, title, description });
  }

  error(message: string, timeout?: number, title?: string, description?: string) {
    this.add({ id: this.uid(), type: 'error', message, timeout, title, description });
  }

  info(message: string, timeout?: number, title?: string, description?: string) {
    this.add({ id: this.uid(), type: 'info', message, timeout, title, description });
  }

  dismiss(id: string) {
    this._notifications.update((list) => list.filter((n) => n.id !== id));
  }

  clear() {
    this._notifications.set([]);
  }

  private uid() {
    return Math.random().toString(36).slice(2, 9);
  }
}
