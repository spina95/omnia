import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FinanceService } from '../../../core/services/finance';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Budget } from './budget.interface';
import { BudgetDialogComponent } from '../budget-dialog/budget-dialog';
import { SelectComponent } from '../../../shared/components/select/select.component';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [CommonModule, FormsModule, BudgetDialogComponent, ConfirmationDialogComponent],
  templateUrl: './budgets.html',
  styleUrls: ['./budgets.css'],
})
export class BudgetsComponent implements OnInit {
  private financeService = inject(FinanceService);
  private cdr = inject(ChangeDetectorRef);
  private notificationService = inject(NotificationService);

  budgets: Budget[] = [];
  loading = false;
  selectedBudget: Budget | null = null;
  isDialogOpen = false;

  // Confirmation Dialog state
  isConfirmDialogOpen = false;
  confirmDialogTitle = '';
  confirmDialogMessage = '';
  pendingDeleteBudget: Budget | null = null;

  ngOnInit() {
    this.loadBudgets();
  }

  async loadBudgets() {
    this.loading = true;
    try {
      const data = await this.financeService.getBudgets();
      this.budgets = data || [];

      // Fetch spending data for each budget
      for (const budget of this.budgets) {
        try {
          const spendingData = await this.financeService.getBudgetSpending(budget.id);
          if (spendingData && spendingData.length > 0) {
            budget.current_spending = spendingData[0].current_spending;
            budget.percentage_used = spendingData[0].percentage_used;
          } else {
            budget.current_spending = 0;
            budget.percentage_used = 0;
          }
        } catch (error) {
          console.error('Error loading budget spending:', error);
          budget.current_spending = 0;
          budget.percentage_used = 0;
        }
      }

      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading budgets:', error);
    } finally {
      this.loading = false;
    }
  }

  openCreateDialog() {
    this.selectedBudget = null;
    this.isDialogOpen = true;
  }

  openEditDialog(budget: Budget) {
    this.selectedBudget = budget;
    this.isDialogOpen = true;
  }

  async deleteBudget(budget: Budget) {
    this.pendingDeleteBudget = budget;
    this.confirmDialogTitle = 'Delete Budget';
    this.confirmDialogMessage = `Are you sure you want to delete the budget for ${budget.payment_types?.name || 'Unknown'}?`;
    this.isConfirmDialogOpen = true;
  }

  async confirmDelete() {
    if (!this.pendingDeleteBudget) return;
    
    const budget = this.pendingDeleteBudget;
    this.isConfirmDialogOpen = false;
    this.pendingDeleteBudget = null;

    try {
      await this.financeService.deleteBudget(budget.id);
      await this.loadBudgets();
      this.notificationService.success('Budget deleted');
    } catch (error) {
      console.error('Error deleting budget:', error);
      this.notificationService.error('Failed to delete budget');
    }
  }

  cancelDelete() {
    this.isConfirmDialogOpen = false;
    this.pendingDeleteBudget = null;
  }

  onDialogClose() {
    this.isDialogOpen = false;
    this.selectedBudget = null;
    this.loadBudgets();
  }
}
