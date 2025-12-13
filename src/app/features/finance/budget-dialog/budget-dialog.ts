import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { FinanceService } from '../../../core/services/finance';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Budget } from '../budgets/budget.interface';
import { SelectComponent } from '../../../shared/components/select/select.component';

@Component({
  selector: 'app-budget-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectComponent],
  templateUrl: './budget-dialog.html',
  styleUrls: ['./budget-dialog.css'],
})
export class BudgetDialogComponent {
  @Input() budget: Budget | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();

  private financeService = inject(FinanceService);

  formData = {
    max_amount: 0,
    payment_type_id: null as number | null,
    category_id: null as number | null,
    period: 'monthly' as 'weekly' | 'monthly' | 'yearly',
  };

  paymentTypes: any[] = [];
  categories: any[] = [];
  paymentTypesOptions: any[] = [];
  categoriesOptions: any[] = [];
  periodOptions: any[] = [];
  loading = false;

  ngOnInit() {
    this.loadPaymentTypes();
    this.loadCategories();
    this.periodOptions = [
      { value: 'weekly', label: 'Weekly' },
      { value: 'monthly', label: 'Monthly' },
      { value: 'yearly', label: 'Yearly' },
    ];
    if (this.budget) {
      this.formData = {
        max_amount: Number(this.budget.max_amount),
        payment_type_id: this.budget.payment_type_id || null,
        category_id: this.budget.category_id || null,
        period: this.budget.period,
      };
    }
  }

  async loadPaymentTypes() {
    try {
      const paymentTypes = await this.financeService.getPaymentTypes();
      this.paymentTypesOptions = [
        { value: null, label: 'All Payment Types' },
        ...paymentTypes.map((pt: any) => ({ value: pt.id, label: pt.name })),
      ];
    } catch (error) {
      console.error('Error loading payment types:', error);
    }
  }

  async loadCategories() {
    try {
      const categories = await this.financeService.getCategories();
      this.categoriesOptions = [
        { value: null, label: 'All Categories' },
        ...categories.map((cat: any) => ({ value: cat.id, label: cat.name })),
      ];
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  async onSave() {
    this.loading = true;
    try {
      const budgetData = {
        ...this.formData,
        payment_type_id: this.formData.payment_type_id || undefined,
        category_id: this.formData.category_id || undefined,
      };

      if (this.budget) {
        await this.financeService.updateBudget(this.budget.id, budgetData);
      } else {
        await this.financeService.createBudget(budgetData);
      }
      this.save.emit();
      this.onClose();
    } catch (error) {
      console.error('Error saving budget:', error);
    } finally {
      this.loading = false;
    }
  }

  onClose() {
    this.close.emit();
  }

  getPaymentTypeName(paymentTypeId: number | null): string {
    if (!paymentTypeId) {
      return 'All Accounts';
    }
    const paymentType = this.paymentTypes.find((pt) => pt.id === paymentTypeId);
    return paymentType ? paymentType.name : 'Unknown';
  }

  getPaymentTypeColor(paymentTypeId: number | null): string {
    if (!paymentTypeId) {
      return '#82cda8'; // Default color for "All Accounts"
    }
    const paymentType = this.paymentTypes.find((pt) => pt.id === paymentTypeId);
    return paymentType ? paymentType.color : '#82cda8';
  }

  getCategoryName(categoryId: number): string {
    const category = this.categories.find((cat) => cat.id === categoryId);
    return category ? category.name : 'Unknown';
  }

  getCategoryColor(categoryId: number): string {
    const category = this.categories.find((cat) => cat.id === categoryId);
    return category ? category.color : '#82cda8';
  }
}
