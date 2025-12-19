import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../../core/services/finance';
import { SelectComponent, SelectOption } from '../select/select.component';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-scheduled-expense-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectComponent, ConfirmationDialogComponent],
  templateUrl: './scheduled-expense-dialog.component.html',
  styleUrls: ['./scheduled-expense-dialog.component.css'],
})
export class ScheduledExpenseDialogComponent implements OnInit {
  @Input() expense: any = null;
  @Input() isOpen: boolean = false;
  @Output() closeDialog = new EventEmitter<void>();
  @Output() scheduledExpenseSaved = new EventEmitter<any>();

  // Form data
  formData: any = {
    name: '',
    amount: 0,
    date: '',
    category_id: null,
    paymenttype_id: null,
    repeat_interval: null,
  };

  // Metadata
  categories: any[] = [];
  paymentTypes: any[] = [];

  // Select options for Spartan Select component
  categoriesOptions: SelectOption[] = [];
  paymentTypesOptions: SelectOption[] = [];
  frequencyOptions: SelectOption[] = [];

  isLoading = false;
  isSaving = false;
  errorMessage: string | null = null;
  formErrorMessage: string | null = null;
  isEditing = false;

  // Scheduled expenses data
  scheduledExpenses: any[] = [];

  // Confirmation Dialog state
  isConfirmDialogOpen = false;
  confirmDialogTitle = '';
  confirmDialogMessage = '';
  pendingDeleteExpense: any = null;

  constructor(private financeService: FinanceService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadMetadata();
    this.frequencyOptions = [
      { value: 'daily', label: 'Daily' },
      { value: 'weekly', label: 'Weekly' },
      { value: 'monthly', label: 'Monthly' },
    ];
  }

  ngOnChanges() {
    if (this.isOpen) {
      // Load scheduled expenses when dialog opens
      this.refreshScheduledExpenses();

      if (this.expense) {
        // Edit mode - populate form with expense data
        this.formData = {
          name: this.expense.name || '',
          amount: this.expense.amount || 0,
          date: this.expense.date ? new Date(this.expense.date).toISOString().split('T')[0] : '',
          category_id: this.expense.expense_categories?.id || null,
          paymenttype_id: this.expense.payment_types?.id || null,
          repeat_interval: this.expense.repeat_interval || null,
        };
      } else {
        // Create mode - reset form with default values
        this.formData = {
          name: '',
          amount: 0,
          date: new Date().toISOString().split('T')[0],
          category_id: null,
          paymenttype_id: null,
          repeat_interval: 'monthly',
        };
      }
    }
  }

  async loadMetadata() {
    this.isLoading = true;
    try {
      const [cats, pts] = await Promise.all([
        this.financeService.getCategories(),
        this.financeService.getPaymentTypes(),
      ]);
      this.categories = cats || [];
      this.paymentTypes = pts || [];

      // Convert to SelectOption format for Spartan Select component
      this.categoriesOptions = this.categories.map((cat) => ({
        value: cat.id,
        label: cat.name,
        description: cat.description,
      }));
      this.paymentTypesOptions = this.paymentTypes.map((pt) => ({
        value: pt.id,
        label: pt.name,
      }));
    } catch (e) {
      console.error('Failed to load metadata', e);
      this.errorMessage = 'Failed to load categories and payment types';
    } finally {
      this.isLoading = false;
    }
  }

  close() {
    this.closeDialog.emit();
    this.resetForm();
  }

  async save() {
    if (!this.validateForm()) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = null;

    try {
      if (this.expense) {
        // Update existing scheduled expense
        const updatedExpense = await this.financeService.updateScheduledExpense(this.expense.id, {
          name: this.formData.name,
          amount: parseFloat(this.formData.amount),
          date: this.formData.date,
          category_id: this.formData.category_id,
          paymenttype_id: this.formData.paymenttype_id,
          repeat_interval: this.formData.repeat_interval,
        });
        this.scheduledExpenseSaved.emit(updatedExpense);
      } else {
        // Create new scheduled expense
        const newExpense = await this.financeService.createScheduledExpense({
          name: this.formData.name,
          amount: parseFloat(this.formData.amount),
          date: this.formData.date,
          category_id: this.formData.category_id,
          paymenttype_id: this.formData.paymenttype_id,
          repeat_interval: this.formData.repeat_interval,
        });
        this.scheduledExpenseSaved.emit(newExpense);
      }

      this.close();
    } catch (e: any) {
      console.error('Failed to save scheduled expense', e);
      this.errorMessage = e.message || 'Failed to save scheduled expense';
    } finally {
      this.isSaving = false;
    }
  }

  validateForm(): boolean {
    if (!this.formData.name || this.formData.name.trim() === '') {
      this.errorMessage = 'Name is required';
      return false;
    }
    if (!this.formData.amount || this.formData.amount <= 0) {
      this.errorMessage = 'Amount must be greater than 0';
      return false;
    }
    if (!this.formData.date) {
      this.errorMessage = 'Start date is required';
      return false;
    }
    if (!this.formData.repeat_interval) {
      this.errorMessage = 'Frequency is required';
      return false;
    }
    return true;
  }

  resetForm() {
    this.formData = {
      name: '',
      amount: 0,
      date: '',
      category_id: null,
      paymenttype_id: null,
      repeat_interval: null,
    };
    this.errorMessage = null;
  }

  getCategoryColor(categoryId: number | null): string {
    if (!categoryId) return '#71717a';
    const category = this.categories.find((c) => c.id === categoryId);
    return category?.color || '#71717a';
  }

  getPaymentTypeColor(paymentTypeId: number | null): string {
    if (!paymentTypeId) return '#71717a';
    const paymentType = this.paymentTypes.find((p) => p.id === paymentTypeId);
    return paymentType?.color || '#71717a';
  }

  getCategoryName(categoryId: number | null): string {
    if (!categoryId) return '';
    const category = this.categories.find((c) => c.id === categoryId);
    return category?.name || '';
  }

  getPaymentTypeName(paymentTypeId: number | null): string {
    if (!paymentTypeId) return '';
    const paymentType = this.paymentTypes.find((p) => p.id === paymentTypeId);
    return paymentType?.name || '';
  }

  onCategoryChange() {
    // Handle category selection change if needed
    console.log('Category changed:', this.formData.category_id);
  }

  onPaymentTypeChange() {
    // Handle payment type selection change if needed
    console.log('Payment type changed:', this.formData.paymenttype_id);
  }

  async refreshScheduledExpenses() {
    this.isLoading = true;
    this.errorMessage = null;
    try {
      this.scheduledExpenses = await this.financeService.getScheduledExpenses();
    } catch (e: any) {
      console.error('Failed to load scheduled expenses', e);
      this.errorMessage = 'Failed to load scheduled expenses';
    } finally {
      this.isLoading = false;
      // Force change detection to update the UI
      this.cdr.detectChanges();
    }
  }

  editScheduledExpense(expense: any) {
    this.isEditing = true;
    this.formData = {
      name: expense.name || '',
      amount: expense.amount || 0,
      date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : '',
      category_id: expense.expense_categories?.id || null,
      paymenttype_id: expense.payment_types?.id || null,
      repeat_interval: expense.repeat_interval || null,
    };
  }

  cancelEdit() {
    this.isEditing = false;
    this.formData = {
      name: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      category_id: null,
      paymenttype_id: null,
      repeat_interval: 'monthly',
    };
  }

  async deleteScheduledExpense(expense: any) {
    this.pendingDeleteExpense = expense;
    this.confirmDialogTitle = 'Delete Scheduled Expense';
    this.confirmDialogMessage = `Are you sure you want to delete "${expense.name}"?`;
    this.isConfirmDialogOpen = true;
  }

  async confirmDelete() {
    if (!this.pendingDeleteExpense) return;
    
    const expense = this.pendingDeleteExpense;
    this.isConfirmDialogOpen = false;
    this.pendingDeleteExpense = null;

    try {
      await this.financeService.deleteScheduledExpense(expense.id);
      // Remove from local array
      this.scheduledExpenses = this.scheduledExpenses.filter((e) => e.id !== expense.id);
    } catch (e: any) {
      console.error('Failed to delete scheduled expense', e);
      this.errorMessage = 'Failed to delete scheduled expense';
    }
  }

  cancelDelete() {
    this.isConfirmDialogOpen = false;
    this.pendingDeleteExpense = null;
  }
}
