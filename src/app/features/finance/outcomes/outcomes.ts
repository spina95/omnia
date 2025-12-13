import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColDef } from 'ag-grid-community';
import { FinanceService } from '../../../core/services/finance';
import { DataTableComponent, SortChangeEvent } from '../../../shared/components/data-table/data-table.component';
import { ExpenseDialogComponent } from '../../../shared/components/expense-dialog/expense-dialog.component';

@Component({
  selector: 'app-outcomes',
  standalone: true,
  imports: [CommonModule, DataTableComponent, ExpenseDialogComponent],
  templateUrl: './outcomes.html',
  styleUrls: ['./outcomes.css']
})
export class OutcomesComponent implements OnInit {
  // Data state
  rowData: any[] = [];
  isLoading = false;
  errorMessage: string | null = null;

  // Pagination state
  currentPage = 1;
  pageSize = 20;
  totalRecords = 0;

  // Sort state
  currentSort = 'date';
  currentOrder: 'asc' | 'desc' = 'desc';

  // Filter state - individual properties
  searchQuery: string = '';
  selectedMonth: number | null = null;
  selectedYear: number | null = new Date().getFullYear();
  selectedCategory: number | null = null;
  selectedPaymentType: number | null = null;

  // Dialog state
  isDialogOpen = false;
  selectedExpense: any = null;

  // Metadata
  categories: any[] = [];
  paymentTypes: any[] = [];
  months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];
  years: number[] = [];

  // Column definitions for AG Grid
  columnDefs: ColDef[] = [
    { field: 'id', headerName: 'ID', width: 80, hide: true },
    {
      field: 'name',
      headerName: 'Description',
      flex: 1.5,
      minWidth: 200,
      cellStyle: { fontWeight: '500', display: 'flex', alignItems: 'center' }
    },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 140,
      type: 'rightAligned',
      valueFormatter: params => {
        return params.value ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(params.value) : '-';
      },
      cellStyle: { fontWeight: '600', color: '#fff', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }
    },
    {
      field: 'date',
      headerName: 'Date',
      width: 130,
      valueFormatter: params => {
        if (!params.value) return '-';
        return new Date(params.value).toLocaleDateString();
      },
      cellStyle: { color: '#a1a1aa', display: 'flex', alignItems: 'center' }
    },
    {
      headerName: 'Category',
      width: 150,
      valueGetter: params => params.data.expense_categories,
      cellRenderer: (params: any) => {
        const cat = params.value;
        if (!cat) return '-';
        const color = cat.color || '#71717a';
        const bg = color + '33';
        return `
          <span style="background-color: ${bg}; color: ${color}; border-color: ${color}4d;" 
                class="px-2.5 py-0.5 rounded-full border text-xs font-medium inline-flex items-center">
            ${cat.name}
          </span>`;
      },
      cellStyle: { display: 'flex', alignItems: 'center' }
    },
    {
      headerName: 'Account',
      width: 160,
      valueGetter: params => params.data.payment_types,
      cellRenderer: (params: any) => {
        const pt = params.value;
        if (!pt) return '-';
        const color = pt.color || '#71717a';
        const bg = color + '33';
        return `
          <span style="background-color: ${bg}; color: ${color}; border-color: ${color}4d;" 
                class="px-2.5 py-0.5 rounded-full border text-xs font-medium inline-flex items-center">
            ${pt.name}
          </span>`;
      },
      cellStyle: { display: 'flex', alignItems: 'center' }
    },
    {
      headerName: '',
      width: 60,
      pinned: 'right',
      cellRenderer: (params: any) => {
        return `
          <button 
            class="delete-btn p-1.5 rounded hover:bg-red-900/20 text-zinc-500 hover:text-red-400 transition-colors"
            data-action="delete"
            data-id="${params.data.id}"
            title="Delete expense">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>`;
      },
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
      suppressHeaderMenuButton: true,
      sortable: false
    }
  ];

  defaultColDef: ColDef = {
    sortable: true,
    filter: false,
    suppressHeaderMenuButton: true,
    resizable: true,
    cellStyle: { display: 'flex', alignItems: 'center' }
  };

  constructor(
    private financeService: FinanceService,
    private cdr: ChangeDetectorRef
  ) {
    // Generate last 5 years
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 5; i++) {
      this.years.push(currentYear - i);
    }
  }

  ngOnInit() {
    this.loadMetadata();
  }

  async loadMetadata() {
    try {
      const [cats, pts] = await Promise.all([
        this.financeService.getCategories(),
        this.financeService.getPaymentTypes()
      ]);
      this.categories = cats || [];
      this.paymentTypes = pts || [];
    } catch (e) {
      console.error('Failed to load metadata', e);
    }
  }

  onGridReady() {
    this.loadData();
  }

  onSortChanged(event: SortChangeEvent) {
    this.currentSort = event.field;
    this.currentOrder = event.order;
    this.currentPage = 1;
    this.loadData();
  }

  onPageChanged(page: number) {
    this.currentPage = page;
    this.loadData();
  }

  onFilterChanged() {
    this.currentPage = 1;
    this.loadData();
  }

  onRowClicked(expense: any) {
    this.selectedExpense = expense;
    this.isDialogOpen = true;
  }

  onCellClicked(event: any) {
    // Check if the delete button was clicked
    const target = event.event?.target as HTMLElement;
    const deleteButton = target?.closest('[data-action="delete"]');

    if (deleteButton) {
      const expenseId = deleteButton.getAttribute('data-id');
      if (expenseId) {
        this.deleteExpense(parseInt(expenseId));
      }
      return; // Don't open the edit dialog
    }

    // Otherwise, open the edit dialog
    this.onRowClicked(event.data);
  }

  async deleteExpense(id: number) {
    // Find the expense to show its name in the confirmation
    const expense = this.rowData.find(e => e.id === id);
    const expenseName = expense?.name || 'this expense';

    // Show confirmation dialog
    const confirmed = confirm(`Are you sure you want to delete "${expenseName}"? This action cannot be undone.`);

    if (!confirmed) return;

    try {
      await this.financeService.deleteExpense(id);

      // Remove from table
      this.rowData = this.rowData.filter(e => e.id !== id);
      this.totalRecords--;
      this.cdr.detectChanges();
    } catch (e: any) {
      console.error('Failed to delete expense', e);
      alert('Failed to delete expense: ' + (e.message || 'Unknown error'));
    }
  }

  onAddOutcome() {
    this.selectedExpense = null; // null expense triggers create mode
    this.isDialogOpen = true;
  }

  onDialogClose() {
    this.isDialogOpen = false;
    this.selectedExpense = null;
  }

  onExpenseSaved(expense: any) {
    if (this.selectedExpense) {
      // Update mode - update the row in the table
      const index = this.rowData.findIndex(e => e.id === expense.id);
      if (index !== -1) {
        this.rowData[index] = expense;
        // Trigger change detection
        this.rowData = [...this.rowData];
      }
    } else {
      // Create mode - reload data to show the new expense
      this.loadData();
    }
  }

  async loadData() {
    this.isLoading = true;
    this.errorMessage = null;
    try {
      const { data, count } = await this.financeService.getExpenses({
        page: this.currentPage,
        pageSize: this.pageSize,
        sort: this.currentSort,
        order: this.currentOrder,
        month: this.selectedMonth || undefined,
        year: this.selectedYear || undefined,
        categoryId: this.selectedCategory || undefined,
        paymentTypeId: this.selectedPaymentType || undefined,
        search: this.searchQuery,
      });

      if (data) {
        this.rowData = data;
        if (count !== null) this.totalRecords = count;
      }
    } catch (e: any) {
      console.error('Error loading expenses', e);
      this.errorMessage = e.message || 'Failed to load expenses';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges(); // Manually trigger change detection
    }
  }
}
