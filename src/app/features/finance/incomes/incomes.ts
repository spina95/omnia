import { Component, OnInit, ChangeDetectorRef, inject, ViewChild, TemplateRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColDef } from 'ag-grid-community';
import { FinanceService } from '../../../core/services/finance';
import { NotificationService } from '../../../core/services/notification.service';
import { PageHeaderService } from '../../../core/services/page-header.service';
import { PageHeaderActionsService } from '../../../core/services/page-header-actions.service';
import {
  DataTableComponent,
  SortChangeEvent,
} from '../../../shared/components/data-table/data-table.component';
import { IncomeDialogComponent } from '../../../shared/components/income-dialog/income-dialog.component';

@Component({
  selector: 'app-incomes',
  standalone: true,
  imports: [CommonModule, DataTableComponent, IncomeDialogComponent],
  templateUrl: './incomes.html',
  styleUrls: ['./incomes.css'],
})
export class IncomesComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('headerActions', { static: false }) headerActionsTemplate!: TemplateRef<any>;
  
  private pageHeaderService = inject(PageHeaderService);
  private pageHeaderActionsService = inject(PageHeaderActionsService);
  
  // Data state
  rowData: any[] = [];
  isLoading = false;
  errorMessage: string | null = null;

  // Pagination state
  currentPage = 1;
  pageSize = 20;
  totalRecords = 0;

  // Computed total
  get totalAmount(): number {
    return this.rowData.reduce((sum, item) => sum + (item.amount || 0), 0);
  }

  // Sort state
  currentSort = 'date';
  currentOrder: 'asc' | 'desc' = 'desc';

  // Filter state
  searchQuery: string = '';
  selectedMonth: number | null = null;
  selectedYear: number | null = new Date().getFullYear();
  selectedCategory: number | null = null;
  selectedPaymentType: number | null = null;

  //Dialog state
  isDialogOpen = false;
  selectedIncome: any = null;

  // Metadata
  categories: any[] = [];
  paymentTypes: any[] = [];
  months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];
  years: number[] = [];

  // Column definitions
  columnDefs: ColDef[] = [
    { field: 'id', headerName: 'ID', width: 80, hide: true },
    {
      field: 'name',
      headerName: 'Description',
      flex: 1.5,
      minWidth: 200,
      cellStyle: { fontWeight: '500', display: 'flex', alignItems: 'center' },
    },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 140,
      type: 'rightAligned',
      valueFormatter: (params) => {
        return params.value
          ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(
              params.value
            )
          : '-';
      },
      cellStyle: {
        fontWeight: '600',
        color: '#fff',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
      },
    },
    {
      field: 'date',
      headerName: 'Date',
      width: 130,
      valueFormatter: (params) => {
        if (!params.value) return '-';
        return new Date(params.value).toLocaleDateString();
      },
      cellStyle: { color: '#a1a1aa', display: 'flex', alignItems: 'center' },
    },
    {
      headerName: 'Category',
      width: 150,
      valueGetter: (params) => params.data.income_categories,
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
      cellStyle: { display: 'flex', alignItems: 'center' },
    },
    {
      headerName: 'Account',
      width: 160,
      valueGetter: (params) => params.data.payment_types,
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
      cellStyle: { display: 'flex', alignItems: 'center' },
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
            title="Delete income">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>`;
      },
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
      suppressHeaderMenuButton: true,
      sortable: false,
    },
  ];

  defaultColDef: ColDef = {
    sortable: true,
    filter: false,
    suppressHeaderMenuButton: true,
    resizable: true,
    cellStyle: { display: 'flex', alignItems: 'center' },
  };

  constructor(
    private financeService: FinanceService,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService
  ) {
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 5; i++) {
      this.years.push(currentYear - i);
    }
  }

  ngOnInit() {
    this.pageHeaderService.setHeader('Incomes');
    this.loadMetadata();
  }

  ngAfterViewInit() {
    this.pageHeaderActionsService.setActions(this.headerActionsTemplate);
    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    this.pageHeaderActionsService.clearActions();
  }

  async loadMetadata() {
    try {
      const [cats, pts] = await Promise.all([
        this.financeService.getIncomeCategories(),
        this.financeService.getPaymentTypes(),
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

  onCellClicked(event: any) {
    const target = event.event?.target as HTMLElement;
    const deleteButton = target?.closest('[data-action="delete"]');

    if (deleteButton) {
      const incomeId = deleteButton.getAttribute('data-id');
      if (incomeId) {
        this.deleteIncome(parseInt(incomeId));
      }
      return;
    }

    this.selectedIncome = event.data;
    this.isDialogOpen = true;
  }

  async deleteIncome(id: number) {
    const income = this.rowData.find((i) => i.id === id);
    const incomeName = income?.name || 'this income';

    const confirmed = confirm(
      `Are you sure you want to delete "${incomeName}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await this.financeService.deleteIncome(id);

      this.rowData = this.rowData.filter((i) => i.id !== id);
      this.totalRecords--;
      this.notificationService.success('Income deleted');
      this.cdr.detectChanges();
    } catch (e: any) {
      console.error('Failed to delete income', e);
      alert('Failed to delete income: ' + (e.message || 'Unknown error'));
    }
  }

  onAddIncome() {
    this.selectedIncome = null;
    this.isDialogOpen = true;
  }

  onDialogClose() {
    this.isDialogOpen = false;
    this.selectedIncome = null;
  }

  onIncomeSaved(income: any) {
    if (this.selectedIncome) {
      const index = this.rowData.findIndex((i) => i.id === income.id);
      if (index !== -1) {
        this.rowData[index] = income;
        this.rowData = [...this.rowData];
        this.notificationService.success(
          'Income updated',
          3000,
          'Income updated',
          `Updated "${income.name}" (${income.amount} €)`
        );
      }
    } else {
      this.loadData();
      this.notificationService.success(
        'Income created',
        3000,
        'Income created',
        `Created "${income.name}" (${income.amount} €)`
      );
    }
  }

  async loadData() {
    this.isLoading = true;
    this.errorMessage = null;
    try {
      const { data, count } = await this.financeService.getIncomes({
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
      console.error('Error loading incomes', e);
      this.errorMessage = e.message || 'Failed to load incomes';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }
}
