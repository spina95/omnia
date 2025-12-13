import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FinanceService } from '../../../core/services/finance';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Budget } from './budget.interface';
import { BudgetDialogComponent } from '../budget-dialog/budget-dialog';
import { SelectComponent } from '../../../shared/components/select/select.component';

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [CommonModule, FormsModule, BudgetDialogComponent],
  templateUrl: './budgets.html',
  styleUrls: ['./budgets.css'],
})
export class BudgetsComponent implements OnInit {
  private financeService = inject(FinanceService);
  private cdr = inject(ChangeDetectorRef);

  budgets: Budget[] = [];
  loading = false;
  selectedBudget: Budget | null = null;
  isDialogOpen = false;

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
    if (
      confirm(
        `Are you sure you want to delete the budget for ${budget.payment_types?.name || 'Unknown'}?`
      )
    ) {
      try {
        await this.financeService.deleteBudget(budget.id);
        await this.loadBudgets();
      } catch (error) {
        console.error('Error deleting budget:', error);
      }
    }
  }

  onDialogClose() {
    this.isDialogOpen = false;
    this.selectedBudget = null;
    this.loadBudgets();
  }
}
