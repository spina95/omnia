import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ViewChild,
  TemplateRef,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule, ChartComponent } from 'ng-apexcharts';
import { ApexOptions } from 'apexcharts';
import {
  InvestmentsService,
  PortfolioSummary,
  GeographicalAllocation,
} from '../../../core/services/investments.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PageHeaderService } from '../../../core/services/page-header.service';
import { PageHeaderActionsService } from '../../../core/services/page-header-actions.service';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { ColDef, GridReadyEvent } from 'ag-grid-community';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { InvestmentDialogComponent } from './investment-dialog/investment-dialog.component';

@Component({
  selector: 'app-investments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgApexchartsModule,
    ChartComponent,
    DataTableComponent,
    ConfirmationDialogComponent,
    InvestmentDialogComponent,
  ],
  templateUrl: './investments.component.html',
  styleUrls: ['./investments.component.css'],
})
export class InvestmentsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('headerActions', { static: false }) headerActionsTemplate!: TemplateRef<any>;

  private investmentsService = inject(InvestmentsService);
  private notificationService = inject(NotificationService);
  private pageHeaderService = inject(PageHeaderService);
  private pageHeaderActionsService = inject(PageHeaderActionsService);
  private cd = inject(ChangeDetectorRef);

  // State
  portfolioSummary = signal<PortfolioSummary | null>(null);
  geographicalAllocation = signal<GeographicalAllocation[]>([]);
  transactions = signal<any[]>([]);
  isLoading = signal(true);
  isRefreshing = signal(false);
  lastUpdated = signal<Date | null>(null);

  // Computed KPIs
  totalValue = computed(() => this.portfolioSummary()?.totalValue ?? 0);
  totalGainLoss = computed(() => this.portfolioSummary()?.totalGainLoss ?? 0);
  totalGainLossPercent = computed(() => this.portfolioSummary()?.totalGainLossPercent ?? 0);

  // Dialog state
  showInvestmentDialog = signal(false);
  editingTransaction = signal<any | null>(null);

  // Confirmation Dialog state
  isConfirmDialogOpen = false;
  confirmDialogTitle = '';
  confirmDialogMessage = '';
  pendingDeleteTransaction: any = null;

  // Portfolio Holdings Table Config
  portfolioColumnDefs: ColDef[] = [
    {
      field: 'ticker',
      headerName: 'Ticker',
      sortable: true,
      filter: true,
      width: 120,
    },
    {
      field: 'totalQuantity',
      headerName: 'Quantity',
      sortable: true,
      width: 120,
      valueFormatter: (params) => params.value?.toFixed(2) ?? '0',
    },
    {
      field: 'averageCost',
      headerName: 'Avg Cost',
      sortable: true,
      width: 120,
      valueFormatter: (params) => `€${params.value?.toFixed(2) ?? '0'}`,
    },
    {
      field: 'currentPrice',
      headerName: 'Current Price',
      sortable: true,
      width: 140,
      valueFormatter: (params) => `€${params.value?.toFixed(2) ?? '0'}`,
    },
    {
      field: 'currentValue',
      headerName: 'Value',
      sortable: true,
      width: 130,
      valueFormatter: (params) => `€${params.value?.toFixed(2) ?? '0'}`,
    },
    {
      field: 'gainLoss',
      headerName: 'Gain/Loss',
      sortable: true,
      width: 140,
      cellStyle: (params) => {
        return params.value >= 0 ? { color: '#22c55e' } : { color: '#ef4444' };
      },
      valueFormatter: (params) => {
        const value = params.value ?? 0;
        return `€${value >= 0 ? '+' : ''}${value.toFixed(2)}`;
      },
    },
    {
      field: 'gainLossPercent',
      headerName: 'Gain/Loss %',
      sortable: true,
      width: 140,
      cellStyle: (params) => {
        return params.value >= 0 ? { color: '#22c55e' } : { color: '#ef4444' };
      },
      valueFormatter: (params) => {
        const value = params.value ?? 0;
        return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
      },
    },
    {
      field: 'country',
      headerName: 'Country',
      sortable: true,
      filter: true,
      width: 120,
    },
  ];

  // Transactions Table Config
  transactionsColumnDefs: ColDef[] = [
    {
      field: 'transaction_date',
      headerName: 'Date',
      sortable: true,
      width: 120,
      valueFormatter: (params) => {
        return params.value ? new Date(params.value).toLocaleDateString('it-IT') : '';
      },
    },
    {
      field: 'ticker',
      headerName: 'Ticker',
      sortable: true,
      filter: true,
      width: 120,
    },
    {
      field: 'transaction_type',
      headerName: 'Type',
      sortable: true,
      filter: true,
      width: 100,
      cellStyle: (params) => {
        return params.value === 'BUY' ? { color: '#22c55e' } : { color: '#ef4444' };
      },
    },
    {
      field: 'quantity',
      headerName: 'Quantity',
      sortable: true,
      width: 120,
      valueFormatter: (params) => params.value?.toFixed(2) ?? '0',
    },
    {
      field: 'purchase_price',
      headerName: 'Price',
      sortable: true,
      width: 120,
      valueFormatter: (params) => `€${params.value?.toFixed(2) ?? '0'}`,
    },
    {
      headerName: 'Total',
      sortable: true,
      width: 130,
      valueGetter: (params) => {
        const quantity = params.data?.quantity ?? 0;
        const price = params.data?.purchase_price ?? 0;
        return quantity * price;
      },
      valueFormatter: (params) => `€${params.value?.toFixed(2) ?? '0'}`,
    },
    {
      field: 'notes',
      headerName: 'Notes',
      filter: true,
      flex: 1,
      minWidth: 150,
    },
    {
      headerName: 'Actions',
      width: 120,
      cellRenderer: (params: any) => {
        const container = document.createElement('div');
        container.className = 'flex gap-2';

        const editBtn = document.createElement('button');
        editBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>`;
        editBtn.className = 'text-blue-400 hover:text-blue-300';
        editBtn.onclick = () => this.editTransaction(params.data);

        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>`;
        deleteBtn.className = 'text-red-400 hover:text-red-300';
        deleteBtn.onclick = () => this.deleteTransaction(params.data);

        container.appendChild(editBtn);
        container.appendChild(deleteBtn);

        return container;
      },
    },
  ];

  // Chart Options
  compositionChartOptions = {
    chart: {
      type: 'donut' as const,
      height: 350,
      background: 'transparent',
      foreColor: '#e5e7eb',
    },
    labels: [] as string[],
    series: [] as number[],
    colors: [
      '#22c55e',
      '#3b82f6',
      '#f59e0b',
      '#ef4444',
      '#8b5cf6',
      '#ec4899',
      '#06b6d4',
      '#84cc16',
    ],
    legend: {
      position: 'bottom' as const,
      labels: {
        colors: '#e5e7eb',
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: any) => `${val.toFixed(1)}%`,
    },
    tooltip: {
      theme: 'dark' as const,
      y: {
        formatter: (val: number) => `€${val.toFixed(2)}`,
      },
    },
  };

  geographicalChartOptions = {
    chart: {
      type: 'treemap' as const,
      height: 350,
      background: 'transparent',
      foreColor: '#e5e7eb',
      toolbar: {
        show: false,
      },
    },
    series: [] as any[],
    colors: ['#22c55e'],
    legend: {
      show: false,
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '14px',
        colors: ['#ffffff'],
      },
      formatter: (text: string, opts: any) => {
        return [text, `${opts.value.toFixed(1)}%`];
      },
    },
    tooltip: {
      theme: 'dark' as const,
      y: {
        formatter: (val: number, opts: any) => {
          const country = opts.w.config.series[0].data[opts.dataPointIndex].x;
          const allocation = this.geographicalAllocation().find((a) => a.country === country);
          return `€${allocation?.value.toFixed(2) ?? '0'}`;
        },
      },
    },
  };

  ngOnInit(): void {
    this.pageHeaderService.setHeader('Investments');
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.pageHeaderActionsService.setActions(this.headerActionsTemplate);
    this.cd.detectChanges();
  }

  ngOnDestroy(): void {
    this.pageHeaderActionsService.clearActions();
  }

  async loadData(forceRefresh: boolean = false): Promise<void> {
    try {
      this.isLoading.set(true);

      console.log('🔄 Loading investment data...');

      const [portfolioSummary, geographicalAllocation, transactionsResult] = await Promise.all([
        this.investmentsService.getPortfolioSummary(forceRefresh),
        this.investmentsService.getGeographicalAllocation(forceRefresh),
        this.investmentsService.getTransactions({ pageSize: 1000 }),
      ]);

      console.log('✅ Data loaded:', {
        portfolioSummary,
        geographicalAllocation,
        transactions: transactionsResult.data,
      });

      this.portfolioSummary.set(portfolioSummary);
      this.geographicalAllocation.set(geographicalAllocation);
      this.transactions.set(transactionsResult.data);

      console.log('📊 Signals updated:', {
        portfolioHoldings: this.portfolioSummary()?.holdings?.length,
        portfolioFirstHolding: this.portfolioSummary()?.holdings?.[0],
        transactions: this.transactions().length,
        transactionFirst: this.transactions()?.[0],
        geoAllocation: this.geographicalAllocation().length,
      });

      // Force change detection
      this.cd.detectChanges();

      this.updateCharts();

      if (forceRefresh) {
        this.lastUpdated.set(new Date());
      }
    } catch (error: any) {
      console.error('❌ Error loading investments data:', error);
      this.notificationService.error('Failed to load investments data');
    } finally {
      this.isLoading.set(false);
    }
  }

  async refreshPrices(): Promise<void> {
    try {
      this.isRefreshing.set(true);

      const summary = this.portfolioSummary();
      if (!summary || summary.holdings.length === 0) {
        this.notificationService.info('No holdings to refresh');
        return;
      }

      const tickers = summary.holdings.map((h) => h.ticker);

      this.notificationService.info(`Updating prices for ${tickers.length} ticker(s)...`);

      let successCount = 0;
      let failCount = 0;

      for (const ticker of tickers) {
        try {
          await this.investmentsService.refreshPrice(ticker);
          successCount++;
          await new Promise((resolve) => setTimeout(resolve, 500)); // Delay to avoid rate limits
        } catch (error: any) {
          console.error(`Failed to refresh ${ticker}:`, error);
          failCount++;

          // If rate limited, stop trying
          if (error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
            this.notificationService.error(
              'Rate limit reached. Please try again later or enter prices manually.'
            );
            break;
          }
        }
      }

      await this.loadData(true);

      if (successCount > 0) {
        this.notificationService.success(
          `${successCount} price(s) updated successfully${
            failCount > 0 ? `, ${failCount} failed` : ''
          }`
        );
      } else if (failCount > 0) {
        this.notificationService.error('Failed to update prices. Try entering them manually.');
      }
    } catch (error: any) {
      console.error('Error refreshing prices:', error);
      this.notificationService.error('Failed to refresh prices');
    } finally {
      this.isRefreshing.set(false);
    }
  }

  private updateCharts(): void {
    const summary = this.portfolioSummary();
    const geoAllocation = this.geographicalAllocation();

    if (summary && summary.holdings.length > 0) {
      // Update composition chart
      this.compositionChartOptions = {
        ...this.compositionChartOptions,
        labels: summary.holdings.map((h) => h.ticker),
        series: summary.holdings.map((h) => h.currentValue),
      };

      // Update geographical chart
      if (geoAllocation.length > 0) {
        this.geographicalChartOptions = {
          ...this.geographicalChartOptions,
          series: [
            {
              data: geoAllocation.map((a) => ({
                x: a.country,
                y: a.percentage,
              })),
            },
          ],
        };
      }
    }
  }

  openAddDialog(): void {
    this.editingTransaction.set(null);
    this.showInvestmentDialog.set(true);
  }

  editTransaction(transaction: any): void {
    this.editingTransaction.set(transaction);
    this.showInvestmentDialog.set(true);
  }

  onCellClicked(event: any): void {
    // Handle cell click events from the data table
    // This is called by the data table component when a cell is clicked
    console.log('Cell clicked:', event);
  }

  deleteTransaction(transaction: any): void {
    this.pendingDeleteTransaction = transaction;
    this.confirmDialogTitle = 'Delete Transaction';
    this.confirmDialogMessage = `Are you sure you want to delete this ${transaction.transaction_type} transaction for ${transaction.ticker}?`;
    this.isConfirmDialogOpen = true;
  }

  async confirmDelete(): Promise<void> {
    if (!this.pendingDeleteTransaction) return;

    try {
      await this.investmentsService.deleteTransaction(this.pendingDeleteTransaction.id);
      this.notificationService.success('Transaction deleted successfully');
      await this.loadData();
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      this.notificationService.error('Failed to delete transaction');
    } finally {
      this.isConfirmDialogOpen = false;
      this.pendingDeleteTransaction = null;
    }
  }

  cancelDelete(): void {
    this.isConfirmDialogOpen = false;
    this.pendingDeleteTransaction = null;
  }

  onDialogClose(): void {
    this.showInvestmentDialog.set(false);
    this.editingTransaction.set(null);
    this.loadData();
  }

  formatCurrency(value: number): string {
    return `€${value.toFixed(2)}`;
  }

  formatPercent(value: number): string {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  }

  getGainLossColor(value: number): string {
    return value >= 0 ? 'text-green-500' : 'text-red-500';
  }
}
