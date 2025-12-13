import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-fab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fab.component.html',
  styleUrls: ['./fab.component.css'],
})
export class FabComponent {
  @Output() openExpenseDialog = new EventEmitter<void>();

  onAddExpense() {
    this.openExpenseDialog.emit();
  }
}
