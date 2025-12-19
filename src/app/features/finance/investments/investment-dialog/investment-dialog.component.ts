import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnChanges,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvestmentsService, TransactionType } from '../../../../core/services/investments.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { SelectComponent, SelectOption } from '../../../../shared/components/select/select.component';

@Component({
  selector: 'app-investment-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectComponent],
  templateUrl: './investment-dialog.component.html',
  styleUrls: ['./investment-dialog.component.css'],
})
export class InvestmentDialogComponent implements OnInit, OnChanges {
  @Input() transaction: any = null;
  @Input() isOpen: boolean = false;
  @Output() closeDialog = new EventEmitter<void>();
  @Output() transactionSaved = new EventEmitter<void>();

  private investmentsService = inject(InvestmentsService);
  private notificationService = inject(NotificationService);

  // Form data
  formData: {
    ticker: string;
    quantity: number;
    purchase_price: number;
    transaction_date: string;
    transaction_type: TransactionType;
    notes: string;
  } = {
    ticker: '',
    quantity: 0,
    purchase_price: 0,
    transaction_date: new Date().toISOString().split('T')[0],
    transaction_type: 'BUY',
    notes: '',
  };

  // Transaction type options
  transactionTypeOptions: SelectOption[] = [
    { value: 'BUY', label: 'Buy' },
    { value: 'SELL', label: 'Sell' },
  ];

  // State
  isSaving = signal(false);
  isValidatingTicker = signal(false);
  tickerValidationError = signal<string | null>(null);
  exchangeName = signal<string | null>(null);

  // Ticker suggestions
  tickerSuggestions = signal<string[]>([]);
  showSuggestions = signal(false);

  ngOnInit(): void {
    this.loadTickerSuggestions();
  }

  ngOnChanges(): void {
    if (this.isOpen) {
      if (this.transaction) {
        // Edit mode - populate form with transaction data
        this.formData = {
          ticker: this.transaction.ticker || '',
          quantity: this.transaction.quantity || 0,
          purchase_price: this.transaction.purchase_price || 0,
          transaction_date: this.transaction.transaction_date
            ? new Date(this.transaction.transaction_date).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          transaction_type: this.transaction.transaction_type || 'BUY',
          notes: this.transaction.notes || '',
        };
      } else {
        // Create mode - reset form with default values
        this.formData = {
          ticker: '',
          quantity: 0,
          purchase_price: 0,
          transaction_date: new Date().toISOString().split('T')[0],
          transaction_type: 'BUY',
          notes: '',
        };
      }
      this.tickerValidationError.set(null);
      this.exchangeName.set(null);
    }
  }

  async loadTickerSuggestions(): Promise<void> {
    const tickers = await this.investmentsService.getUniqueTickers();
    this.tickerSuggestions.set(tickers);
  }

  onTickerInput(event: Event): void {
    const input = (event.target as HTMLInputElement).value.toUpperCase();
    this.formData.ticker = input;
    this.tickerValidationError.set(null);
    this.exchangeName.set(null);

    // Show suggestions if input is not empty
    this.showSuggestions.set(input.length > 0);
  }

  selectTickerSuggestion(ticker: string): void {
    this.formData.ticker = ticker;
    this.showSuggestions.set(false);
  }

  onTickerBlur(): void {
    // Delay hiding suggestions to allow click events
    setTimeout(() => {
      this.showSuggestions.set(false);
    }, 200);
  }

  async validateTicker(): Promise<void> {
    if (!this.formData.ticker) {
      this.tickerValidationError.set('Ticker is required');
      return;
    }

    this.isValidatingTicker.set(true);
    this.tickerValidationError.set(null);
    this.exchangeName.set(null);

    try {
      const result = await this.investmentsService.validateTicker(this.formData.ticker);

      if (!result.valid) {
        this.tickerValidationError.set(result.error || 'Invalid ticker');
        this.exchangeName.set(null);
      } else {
        this.exchangeName.set(result.exchangeName || null);
      }
    } catch (error: any) {
      console.error('Error validating ticker:', error);
      this.tickerValidationError.set('Failed to validate ticker');
      this.exchangeName.set(null);
    } finally {
      this.isValidatingTicker.set(false);
    }
  }

  getFilteredSuggestions(): string[] {
    const input = this.formData.ticker.toUpperCase();
    if (!input) return [];

    return this.tickerSuggestions().filter((ticker) =>
      ticker.toUpperCase().includes(input)
    );
  }

  close(): void {
    this.closeDialog.emit();
    this.resetForm();
  }

  private resetForm(): void {
    this.formData = {
      ticker: '',
      quantity: 0,
      purchase_price: 0,
      transaction_date: new Date().toISOString().split('T')[0],
      transaction_type: 'BUY',
      notes: '',
    };
    this.tickerValidationError.set(null);
    this.exchangeName.set(null);
    this.showSuggestions.set(false);
  }

  validateForm(): boolean {
    if (!this.formData.ticker) {
      this.notificationService.error('Ticker is required');
      return false;
    }

    if (!this.formData.quantity || this.formData.quantity <= 0) {
      this.notificationService.error('Quantity must be greater than 0');
      return false;
    }

    if (!this.formData.purchase_price || this.formData.purchase_price < 0) {
      this.notificationService.error('Price must be 0 or greater');
      return false;
    }

    if (!this.formData.transaction_date) {
      this.notificationService.error('Transaction date is required');
      return false;
    }

    return true;
  }

  async save(): Promise<void> {
    if (!this.validateForm()) {
      return;
    }

    this.isSaving.set(true);

    try {
      const transactionData = {
        ticker: this.formData.ticker.toUpperCase(),
        quantity: this.formData.quantity,
        purchase_price: this.formData.purchase_price,
        transaction_date: this.formData.transaction_date,
        transaction_type: this.formData.transaction_type,
        notes: this.formData.notes || undefined,
      };

      if (this.transaction) {
        // Update existing transaction
        await this.investmentsService.updateTransaction(this.transaction.id, transactionData);
        this.notificationService.success('Transaction updated successfully');
      } else {
        // Create new transaction
        await this.investmentsService.createTransaction(transactionData);
        this.notificationService.success('Transaction added successfully');
      }

      this.transactionSaved.emit();
      this.close();
    } catch (error: any) {
      console.error('Error saving transaction:', error);
      this.notificationService.error(error.message || 'Failed to save transaction');
    } finally {
      this.isSaving.set(false);
    }
  }

  get isEditMode(): boolean {
    return !!this.transaction;
  }

  get dialogTitle(): string {
    return this.isEditMode ? 'Edit Transaction' : 'Add Transaction';
  }
}
