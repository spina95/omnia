import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../../core/services/finance';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-income-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './income-dialog.component.html',
  styleUrls: ['./income-dialog.component.css'],
})
export class IncomeDialogComponent implements OnInit {
  @Input() income: any = null;
  @Input() isOpen: boolean = false;
  @Output() closeDialog = new EventEmitter<void>();
  @Output() incomeSaved = new EventEmitter<any>();

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
      if (this.income) {
        // Edit mode - populate form with income data
        this.formData = {
          name: this.income.name || '',
          amount: this.income.amount || 0,
          date: this.income.date ? new Date(this.income.date).toISOString().split('T')[0] : '',
          category_id: this.income.income_categories?.id || null,
          payment_type_id: this.income.payment_types?.id || null,
        };
      } else {
        // Create mode - reset form with default values
        this.formData = {
          name: '',
          amount: 0,
          date: new Date().toISOString().split('T')[0],
          category_id: null,
          payment_type_id: null,
        };
      }
    }
  }

  async loadMetadata() {
    this.isLoading = true;
    try {
      const [cats, pts] = await Promise.all([
        this.financeService.getIncomeCategories(),
        this.financeService.getPaymentTypes(),
      ]);
      this.categories = cats || [];
      this.paymentTypes = pts || [];
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
      if (this.income) {
        // Update existing income
        const updatedIncome = await this.financeService.updateIncome(this.income.id, {
          name: this.formData.name,
          amount: parseFloat(this.formData.amount),
          date: this.formData.date,
          category_id: this.formData.category_id,
          payment_type_id: this.formData.payment_type_id,
        });
        this.incomeSaved.emit(updatedIncome);
        this.notificationService.success(
          'Income updated',
          3000,
          'Income updated',
          `Updated "${updatedIncome.name}" (${updatedIncome.amount} €)`
        );
      } else {
        // Create new income
        const newIncome = await this.financeService.createIncome({
          name: this.formData.name,
          amount: parseFloat(this.formData.amount),
          date: this.formData.date,
          category_id: this.formData.category_id,
          payment_type_id: this.formData.payment_type_id,
        });
        this.incomeSaved.emit(newIncome);
        this.notificationService.success(
          'Income created',
          3000,
          'Income created',
          `Created "${newIncome.name}" (${newIncome.amount} €)`
        );
      }

      this.close();
    } catch (e: any) {
      console.error('Failed to save income', e);
      this.errorMessage = e.message || 'Failed to save income';
      this.notificationService.error((this.errorMessage ?? 'Failed to save income') as string);
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
}
