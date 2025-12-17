import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css'],
})
export class ToastComponent {
  private notificationService = inject(NotificationService);

  get notifications() {
    return this.notificationService.notifications();
  }

  dismiss(id: string) {
    this.notificationService.dismiss(id);
  }
}
