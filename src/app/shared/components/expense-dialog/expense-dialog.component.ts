import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../../core/services/finance';
import { NotificationService } from '../../../core/services/notification.service';
import { SelectComponent, SelectOption } from '../select/select.component';

@Component({
  selector: 'app-expense-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectComponent],
  templateUrl: './expense-dialog.component.html',
  styleUrls: ['./expense-dialog.component.css'],
})
export class ExpenseDialogComponent implements OnInit {
  @Input() expense: any = null;
  @Input() isOpen: boolean = false;
  @Output() closeDialog = new EventEmitter<void>();
  @Output() expenseSaved = new EventEmitter<any>();

  // Form data
  formData: any = {
    name: '',
    amount: 0,
    date: '',
    category_id: null,
    payment_type_id: null,
  };

  // Metadata
  categories: any[] = [];
  paymentTypes: any[] = [];

  // Select options for Spartan Select component
  categoriesOptions: SelectOption[] = [];
  paymentTypesOptions: SelectOption[] = [];

  isLoading = false;
  isSaving = false;
  errorMessage: string | null = null;

  constructor(
    private financeService: FinanceService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.loadMetadata();
  }

  ngOnChanges() {
    if (this.isOpen) {
      if (this.expense) {
        // Edit mode - populate form with expense data
        this.formData = {
          name: this.expense.name || '',
          amount: this.expense.amount || 0,
          date: this.expense.date ? new Date(this.expense.date).toISOString().split('T')[0] : '',
          category_id: this.expense.expense_categories?.id || null,
          payment_type_id: this.expense.payment_types?.id || null,
        };
      } else {
        // Create mode - reset form with default values
        this.formData = {
          name: '',
          amount: 0,
          date: new Date().toISOString().split('T')[0], // Default to today
          category_id: null,
          payment_type_id: null,
        };

        // Set Bank as default payment type when creating new expense
        this.setDefaultPaymentType();
      }
    }
  }

  setDefaultPaymentType() {
    if (!this.expense && this.paymentTypes.length > 0) {
      const bankPaymentType = this.paymentTypes.find((pt) => pt.name.toLowerCase() === 'bank');
      if (bankPaymentType) {
        this.formData.payment_type_id = bankPaymentType.id;
      } else if (this.paymentTypes.length > 0) {
        // Fallback to first payment type if Bank is not found
        this.formData.payment_type_id = this.paymentTypes[0].id;
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
      }));
      this.paymentTypesOptions = this.paymentTypes.map((pt) => ({
        value: pt.id,
        label: pt.name,
      }));

      // Set Bank as default payment type if creating a new expense
      if (!this.expense && this.paymentTypes.length > 0) {
        const bankPaymentType = this.paymentTypes.find((pt) => pt.name.toLowerCase() === 'bank');
        if (bankPaymentType) {
          this.formData.payment_type_id = bankPaymentType.id;
        } else if (this.paymentTypes.length > 0) {
          // Fallback to first payment type if Bank is not found
          this.formData.payment_type_id = this.paymentTypes[0].id;
        }
      }
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
        // Update existing expense
        const updatedExpense = await this.financeService.updateExpense(this.expense.id, {
          name: this.formData.name,
          amount: parseFloat(this.formData.amount),
          date: this.formData.date,
          category_id: this.formData.category_id,
          payment_type_id: this.formData.payment_type_id,
        });
        this.expenseSaved.emit(updatedExpense);
        this.notificationService.success(
          'Expense updated',
          3000,
          'Expense updated',
          `Updated "${updatedExpense.name}" (${updatedExpense.amount} €)`
        );
      } else {
        // Create new expense
        const newExpense = await this.financeService.createExpense({
          name: this.formData.name,
          amount: parseFloat(this.formData.amount),
          date: this.formData.date,
          category_id: this.formData.category_id,
          payment_type_id: this.formData.payment_type_id,
        });
        this.expenseSaved.emit(newExpense);
        this.notificationService.success(
          'Expense created',
          3000,
          'Expense created',
          `Created "${newExpense.name}" (${newExpense.amount} €)`
        );
      }

      this.close();
    } catch (e: any) {
      console.error('Failed to save expense', e);
      this.errorMessage = e.message || 'Failed to save expense';
      this.notificationService.error(this.errorMessage ?? 'Failed to save expense');
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
      this.errorMessage = 'Date is required';
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
      payment_type_id: null,
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
    console.log('Payment type changed:', this.formData.payment_type_id);
  }
}
