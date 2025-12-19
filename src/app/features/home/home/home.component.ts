import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { PlotlyModule } from 'angular-plotly.js';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexDataLabels,
  ApexStroke,
  ApexLegend,
  ApexFill,
  ApexGrid,
  ApexPlotOptions,
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexTooltip,
  ApexTheme,
} from 'ng-apexcharts';
import {
  DashboardService,
  DashboardStats,
  DashboardFilters,
  AccountData,
  SankeyData,
} from '../../../core/services/dashboard.service';
import { FinanceService } from '../../../core/services/finance';
import { MultiselectComponent } from '../../../shared/components/multiselect/multiselect.component';
import { SelectComponent } from '../../../shared/components/select/select.component';
import { FormsModule } from '@angular/forms';
import {
  DateRangeTimelineComponent,
  DateRange,
} from '../../../shared/components/date-range-timeline/date-range-timeline.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    NgApexchartsModule,
    PlotlyModule,
    MultiselectComponent,
    SelectComponent,
    FormsModule,
    DateRangeTimelineComponent,
  ],
  templateUrl: './home.html',
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class HomeComponent implements OnInit {
  // Loading states
  isLoading = true;

  // Dashboard stats
  stats: DashboardStats = {
    totalIncomes: 0,
    totalExpenses: 0,
    balance: 0,
    savingsPercentage: 0,
    period: '',
  };

  // Top expenses
  topExpenses: any[] = [];

  // Payment types proportions
  incomesPaymentTypes: AccountData[] = [];
  expensesPaymentTypes: AccountData[] = [];

  // Chart configurations
  lineChartOptions: any;
  stackedBarChartOptions: any;
  expensesCategoryChartOptions: any;
  expensesAccountChartOptions: any;
  incomesAccountChartOptions: any;
  sankeyChartData: any;
  sankeyChartLayout: any;

  // Filters state
  selectedPeriod:
    | 'current-month'
    | 'last-30-days'
    | 'last-6-months'
    | 'last-12-months'
    | 'all'
    | 'custom' = 'current-month';
  selectedPaymentTypes: number[] = [];
  selectedExpenseCategories: number[] = [];
  selectedIncomeCategories: number[] = [];

  // Filter options
  paymentTypes: any[] = [];
  expenseCategories: any[] = [];
  incomeCategories: any[] = [];

  // Period options for select
  periodOptions = [
    { value: 'current-month', label: 'Current Month' },
    { value: 'last-30-days', label: 'Last 30 days' },
    { value: 'last-6-months', label: 'Last 6 months' },
    { value: 'last-12-months', label: 'Last 12 months' },
    { value: 'all', label: 'All' },
    { value: 'custom', label: 'Custom' },
  ];

  // Date range timeline properties
  timelineMinDate: string = '2022-01-01';
  timelineMaxDate: string = new Date().toISOString().split('T')[0];
  customDateRange: DateRange | null = null;

  // Math object for template usage
  Math = Math;

  private instanceId = Math.random().toString(16).slice(2, 8);
  private timelineDebounceTimer: any = null;
  private readonly TIMELINE_DEBOUNCE_MS = 500; // 500ms di delay

  constructor(
    private dashboardService: DashboardService,
    private financeService: FinanceService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeChartDefaults();
  }

  async ngOnInit() {
    await this.loadFilterOptions();
    await this.updateTimelineFromPeriod(); // Inizializza i cursori in base al periodo selezionato
    await this.loadDashboardData();
  }

  private async loadFilterOptions() {
    try {
      const [paymentTypes, expenseCategories, incomeCategories] = await Promise.all([
        this.financeService.getPaymentTypes(),
        this.financeService.getCategories(),
        this.financeService.getIncomeCategories(),
      ]);
      this.paymentTypes = paymentTypes || [];
      this.expenseCategories = expenseCategories || [];
      this.incomeCategories = incomeCategories || [];
    } catch (error) {
      console.error('Error loading filter options', error);
    }
  }

  private async calculateDateRange(): Promise<{ startDate?: string; endDate?: string }> {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const endDate = startOfNextMonth.toISOString().slice(0, 10);

    switch (this.selectedPeriod) {
      case 'current-month': {
        // Current Month: dal 1 di questo mese all'ultimo giorno del mese
        const year = now.getFullYear();
        const month = now.getMonth() + 1; // JavaScript months are 0-indexed
        const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();

        return {
          startDate: `${year}-${String(month).padStart(2, '0')}-01`,
          endDate: `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
        };
      }
      case 'last-30-days': {
        // Last 30 days: ultimi 30 giorni da oggi
        const start = new Date(now);
        start.setDate(start.getDate() - 30);
        return {
          startDate: start.toISOString().slice(0, 10),
          endDate: today,
        };
      }
      case 'last-6-months': {
        const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        return {
          startDate: start.toISOString().slice(0, 10),
          endDate: endDate,
        };
      }
      case 'last-12-months': {
        const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        return {
          startDate: start.toISOString().slice(0, 10),
          endDate: endDate,
        };
      }
      case 'custom': {
        // Per custom, restituisci il range dalla timeline se disponibile
        if (this.customDateRange) {
          return {
            startDate: this.customDateRange.startDate,
            endDate: this.customDateRange.endDate,
          };
        }
        // Altrimenti fallback a current-month
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
          startDate: start.toISOString().slice(0, 10),
          endDate: lastDayOfMonth.toISOString().slice(0, 10),
        };
      }
      case 'all':
      default: {
        // Get the first date from expenses or incomes
        const firstDate = await this.getFirstTransactionDate();
        return {
          startDate: firstDate || undefined,
          endDate: endDate,
        };
      }
    }
  }

  private async getFirstTransactionDate(): Promise<string | null> {
    return await this.dashboardService.getFirstTransactionDate();
  }

  private async buildFilters(): Promise<DashboardFilters> {
    let startDate: string | undefined;
    let endDate: string | undefined;

    // Se c'è un range personalizzato dalla timeline, usa quello
    if (this.customDateRange) {
      startDate = this.customDateRange.startDate;
      endDate = this.customDateRange.endDate;
    } else {
      // Altrimenti usa il calcolo basato sul periodo selezionato
      const dateRange = await this.calculateDateRange();
      startDate = dateRange.startDate;
      endDate = dateRange.endDate;
    }

    return {
      startDate,
      endDate,
      paymentTypeIds: this.selectedPaymentTypes,
      expenseCategoryIds: this.selectedExpenseCategories,
      incomeCategoryIds: this.selectedIncomeCategories,
    };
  }

  async onPeriodChange(value: string | number | null) {
    this.selectedPeriod = value as
      | 'current-month'
      | 'last-30-days'
      | 'last-6-months'
      | 'last-12-months'
      | 'all'
      | 'custom';

    // Se non è custom, resetta il customDateRange e aggiorna la timeline
    if (this.selectedPeriod !== 'custom') {
      this.customDateRange = null;
      await this.updateTimelineFromPeriod();
    }

    await this.loadDashboardData();
  }

  async onPaymentTypesChange(selectedIds: (number | string)[]) {
    this.selectedPaymentTypes = selectedIds.map((id) => Number(id));
    await this.loadDashboardData();
  }

  async onExpenseCategoriesChange(selectedIds: (number | string)[]) {
    this.selectedExpenseCategories = selectedIds.map((id) => Number(id));
    await this.loadDashboardData();
  }

  async onIncomeCategoriesChange(selectedIds: (number | string)[]) {
    this.selectedIncomeCategories = selectedIds.map((id) => Number(id));
    await this.loadDashboardData();
  }

  private initializeChartDefaults() {
    // Initialize with empty data to prevent errors
    this.lineChartOptions = this.createLineChartOptions([], []);
    this.stackedBarChartOptions = this.createStackedBarOptions([], []);
    this.expensesCategoryChartOptions = this.createPieChartOptions([], 'Expenses by category');
    this.expensesAccountChartOptions = this.createPieChartOptions([], 'Expenses by account');
    this.incomesAccountChartOptions = this.createPieChartOptions([], 'Incomes by account');
  }

  async loadDashboardData() {
    this.isLoading = true;
    console.info('[HomeComponent] loadDashboardData: start');

    try {
      // Run all calls in parallel but never hang if one rejects
      const filters = await this.buildFilters();
      const results = await Promise.allSettled([
        this.dashboardService.getDashboardStats(filters),
        this.dashboardService.getIncomesVsExpenses(filters),
        this.dashboardService.getExpensesByCategory(filters),
        this.dashboardService.getExpensesByCategoryPerMonth(filters),
        this.dashboardService.getExpensesByAccount(filters),
        this.dashboardService.getIncomesByAccount(filters),
        this.dashboardService.getTopExpenses(filters),
        this.dashboardService.getSankeyFlowData(filters),
      ]);

      const [
        statsRes,
        monthlyDataRes,
        categoryDataRes,
        stackedDataRes,
        expensesAccountRes,
        incomesAccountRes,
        topExpensesRes,
        sankeyDataRes,
      ] = results;

      // Helper to extract fulfilled values with sensible fallbacks
      const getValue = <T>(res: PromiseSettledResult<T>, fallback: T): T => {
        if (res.status === 'fulfilled') return res.value;
        console.warn('[HomeComponent] dashboard load item failed', res.reason);
        return fallback;
      };

      const stats = getValue(statsRes, {
        totalIncomes: 0,
        totalExpenses: 0,
        balance: 0,
        savingsPercentage: 0,
        period: '',
      });
      const monthlyData = getValue(monthlyDataRes, []);
      const categoryData = getValue(categoryDataRes, []);
      const stackedData = getValue(stackedDataRes, { categories: [], series: [], months: [] });
      const expensesAccount = getValue(expensesAccountRes, []);
      const incomesAccount = getValue(incomesAccountRes, []);
      const topExpenses = getValue(topExpensesRes, []);
      const sankeyData = getValue(sankeyDataRes, {
        node: { label: [], color: [], pad: 15, thickness: 20 },
        link: { source: [], target: [], value: [], color: [] },
        type: 'sankey',
      });

      // Ensure ALL state updates happen within Angular zone for proper change detection
      this.ngZone.run(() => {
        this.stats = stats;
        this.topExpenses = topExpenses;
        this.expensesPaymentTypes = expensesAccount;
        this.incomesPaymentTypes = incomesAccount;

        // Update charts with data
        this.lineChartOptions = this.createLineChartOptions(
          monthlyData,
          monthlyData.map((d) => d.month)
        );
        this.stackedBarChartOptions = this.createStackedBarOptions(
          stackedData.series,
          stackedData.months
        );
        this.expensesCategoryChartOptions = this.createPieChartOptions(
          categoryData,
          'Expenses by category'
        );
        this.expensesAccountChartOptions = this.createPieChartOptions(
          expensesAccount,
          'Expenses by account'
        );
        this.incomesAccountChartOptions = this.createPieChartOptions(
          incomesAccount,
          'Incomes by account'
        );

        // Update Sankey chart
        console.log('[HomeComponent] Sankey data received:', sankeyData);
        this.createSankeyChart(sankeyData);
        console.log('[HomeComponent] Sankey chart created:', {
          hasData: !!this.sankeyChartData,
          hasLayout: !!this.sankeyChartLayout,
          nodeCount: this.sankeyChartData?.[0]?.node?.label?.length || 0,
        });

        // Force change detection to ensure the view updates
        this.cdr.detectChanges();
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      // Ensure loading state change also happens in Angular zone
      this.ngZone.run(() => {
        this.isLoading = false;
        // Force change detection to ensure the loading spinner disappears
        this.cdr.detectChanges();
      });
      console.info('[HomeComponent] loadDashboardData: end');
    }
  }

  private createLineChartOptions(data: any[], categories: string[]): any {
    const incomes = data.map((d) => d.incomes || 0);
    const expenses = data.map((d) => d.expenses || 0);

    return {
      series: [
        {
          name: 'Incomes',
          data: incomes,
          color: '#3ECF8E',
        },
        {
          name: 'Expenses',
          data: expenses,
          color: '#ef4444',
        },
      ],
      chart: {
        type: 'area',
        height: 350,
        background: 'transparent',
        toolbar: {
          show: false,
        },
        zoom: {
          enabled: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: 'smooth',
        width: 2,
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0.1,
          stops: [0, 90, 100],
        },
      },
      xaxis: {
        categories: categories,
        labels: {
          style: {
            colors: '#a1a1aa',
            fontSize: '12px',
          },
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      yaxis: {
        labels: {
          style: {
            colors: '#a1a1aa',
            fontSize: '12px',
          },
          formatter: (value: number) => {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'EUR',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(value);
          },
        },
      },
      grid: {
        borderColor: '#2a2a2a',
        strokeDashArray: 4,
        xaxis: {
          lines: {
            show: false,
          },
        },
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        labels: {
          colors: '#e4e4e7',
        },
        markers: {
          size: 6,
          strokeWidth: 0,
        },
      },
      tooltip: {
        theme: 'dark',
        y: {
          formatter: (value: number) => {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'EUR',
            }).format(value);
          },
        },
      },
      theme: {
        mode: 'dark',
      },
    };
  }

  private createStackedBarOptions(series: any[], categories: string[]): any {
    // Add opacity to each series
    const seriesWithOpacity = series.map((s) => ({
      ...s,
      data: s.data.map((value: number) => value),
      color: s.color,
    }));

    return {
      series: seriesWithOpacity,
      chart: {
        type: 'bar',
        height: 400,
        stacked: true,
        background: 'transparent',
        toolbar: {
          show: false,
        },
        foreColor: '#a1a1aa',
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '60%',
          borderRadius: 4,
          dataLabels: {
            position: 'top',
          },
        },
      },
      fill: {
        opacity: 0.5,
      },
      dataLabels: {
        enabled: false,
      },
      xaxis: {
        categories: categories,
        labels: {
          style: {
            colors: '#a1a1aa',
            fontSize: '12px',
          },
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      yaxis: {
        labels: {
          style: {
            colors: '#a1a1aa',
            fontSize: '12px',
          },
          formatter: (value: number) => {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'EUR',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(value);
          },
        },
      },
      grid: {
        borderColor: '#2a2a2a',
        strokeDashArray: 4,
        xaxis: {
          lines: {
            show: false,
          },
        },
      },
      legend: {
        position: 'top',
        horizontalAlign: 'left',
        labels: {
          colors: '#e4e4e7',
        },
        markers: {
          width: 10,
          height: 10,
          radius: 5,
          shape: 'circle',
          strokeWidth: 0,
        },
      },
      tooltip: {
        theme: 'dark',
        y: {
          formatter: (value: number) => {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'EUR',
            }).format(value);
          },
        },
      },
      theme: {
        mode: 'dark',
      },
    };
  }

  // Helper: convert #RRGGBB to rgba(r, g, b, alpha)
  private hexToRgba(hex: string, alpha: number): string {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  private createPieChartOptions(data: any[], title: string): any {
    const series = data.map((d) => d.value);
    const labels = data.map((d) => d.name);
    const baseColors = data.map((d) => d.color);

    // 👇 apply opacity per-slice
    const colors =
      baseColors.length > 0
        ? baseColors.map((c) => this.hexToRgba(c, 0.5)) // <= change 0.5 as you like
        : [this.hexToRgba('#71717a', 0.5)];

    return {
      series: series.length > 0 ? series : [1],
      chart: {
        type: 'donut',
        height: 320,
        background: 'transparent',
      },
      labels: labels.length > 0 ? labels : ['No data'],
      colors,
      dataLabels: {
        enabled: false,
      },
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total',
                fontSize: '14px',
                color: '#a1a1aa',
                formatter: (w: any) => {
                  const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                  return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'EUR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(total);
                },
              },
              value: {
                show: true,
                fontSize: '20px',
                color: '#e4e4e7',
                fontWeight: 600,
              },
            },
          },
        },
      },

      // 👇 THIS removes borders between slices
      stroke: {
        show: false, // or keep true and set width: 0
        width: 0,
        colors: ['transparent'],
      },

      legend: {
        position: 'bottom',
        labels: {
          colors: '#e4e4e7',
        },
        markers: {
          size: 6,
          strokeWidth: 0,
        },
      },
      tooltip: {
        theme: 'dark',
        y: {
          formatter: (value: number) =>
            new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'EUR',
            }).format(value),
        },
      },
      theme: {
        mode: 'dark',
      },
      states: {
        hover: {
          filter: {
            type: 'lighten',
            value: 0.1,
          },
        },
      },
    };
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  private createSankeyChart(sankeyData: SankeyData) {
    this.sankeyChartData = [
      {
        type: 'sankey',
        orientation: 'h',
        node: {
          pad: sankeyData.node.pad,
          thickness: sankeyData.node.thickness,
          line: {
            color: 'rgba(255, 255, 255, 0.1)',
            width: 0.5,
          },
          label: sankeyData.node.label,
          color: sankeyData.node.color,
        },
        link: {
          source: sankeyData.link.source,
          target: sankeyData.link.target,
          value: sankeyData.link.value,
          color: sankeyData.link.color,
        },
      },
    ];

    this.sankeyChartLayout = {
      title: {
        font: {
          size: 16,
          color: '#ffffff',
          family: 'Inter, system-ui, sans-serif',
        },
      },
      font: {
        size: 11,
        color: '#a1a1aa',
        family: 'Inter, system-ui, sans-serif',
      },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      height: 600,
      margin: {
        l: 20,
        r: 20,
        t: 60,
        b: 20,
      },
    };
  }

  async onDateRangeChange(range: DateRange | null) {
    this.customDateRange = range;
    console.log('Custom date range selected:', range);

    // Quando l'utente cambia manualmente la timeline, imposta il periodo su custom
    if (range && this.selectedPeriod !== 'custom') {
      this.selectedPeriod = 'custom';
    }

    // Cancella il timer precedente se esiste
    if (this.timelineDebounceTimer) {
      clearTimeout(this.timelineDebounceTimer);
    }

    // Imposta un nuovo timer per caricare i dati dopo il delay
    this.timelineDebounceTimer = setTimeout(async () => {
      await this.loadDashboardData();
      this.timelineDebounceTimer = null;
    }, this.TIMELINE_DEBOUNCE_MS);
  }

  private async updateTimelineFromPeriod() {
    const { startDate, endDate } = await this.calculateDateRange();

    // Aggiorna solo il customDateRange (i cursori) per riflettere il periodo
    // min/max della timeline rimangono sempre 2022 - oggi
    if (startDate && endDate) {
      this.customDateRange = {
        startDate,
        endDate,
      };
    }
  }
}
