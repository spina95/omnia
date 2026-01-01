import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  inject,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, GridApi } from 'ag-grid-community';
import {
  ModuleRegistry,
  AllCommunityModule,
  themeQuartz,
  colorSchemeDark,
  colorSchemeLight,
} from 'ag-grid-community';
import { SelectComponent, SelectOption } from '../select/select.component';
import { MultiselectComponent, MultiselectOption } from '../multiselect/multiselect.component';
import { ThemeService } from '../../../core/services/theme.service';

ModuleRegistry.registerModules([AllCommunityModule]);

/**
 * Configuration interface for filter controls
 */
export interface FilterConfig {
  type: 'search' | 'select' | 'date-month' | 'date-year';
  label?: string;
  placeholder?: string;
  options?: { value: any; label: string }[];
  modelKey: string;
  width?: string;
}

export interface SortChangeEvent {
  field: string;
  order: 'asc' | 'desc';
}

export interface PaginationChangeEvent {
  page: number;
  pageSize: number;
}

export interface FilterChangeEvent {
  filters: Record<string, any>;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, AgGridAngular, FormsModule, SelectComponent, MultiselectComponent],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css'],
})
export class DataTableComponent implements OnInit, OnChanges {
  // Grid Configuration
  @Input() columnDefs: ColDef[] = [];
  @Input() defaultColDef: ColDef = {
    sortable: true,
    filter: false,
    suppressHeaderMenuButton: true,
    resizable: true,
    cellStyle: { display: 'flex', alignItems: 'center' },
  };

  // Data
  @Input() rowData: any[] = [];
  @Input() loading: boolean = false;
  @Input() error: string | null = null;

  // Pagination
  @Input() currentPage: number = 1;
  @Input() pageSize: number = 20;
  @Input() totalRecords: number = 0;
  @Input() showPagination: boolean = true;
  @Input() totalAmount: number = 0; // Total amount to display in footer

  // Filtering - we'll use individual filter properties instead of complex config
  @Input() searchValue: string = '';
  @Input() selectedMonth: number | null = null;
  @Input() selectedYear: number | null = null;
  @Input() selectedCategory: number | null = null;
  @Input() selectedPaymentType: number | null = null;
  @Input() selectedTagIds: number[] = [];

  @Input() categories: any[] = [];
  @Input() paymentTypes: any[] = [];
  @Input() tags: any[] = [];
  @Input() months: any[] = [];
  @Input() years: number[] = [];

  // Appearance
  @Input() headerHeight: number = 48;
  @Input() rowHeight: number = 52;
  @Input() emptyStateMessage: string = 'No records found matching your criteria.';
  @Input() showFilters: boolean = true;

  // Events
  @Output() gridReady = new EventEmitter<GridReadyEvent>();
  @Output() sortChanged = new EventEmitter<SortChangeEvent>();
  @Output() pageChanged = new EventEmitter<number>();
  @Output() rowClicked = new EventEmitter<any>();
  @Output() cellClicked = new EventEmitter<any>(); // For handling cell-specific actions like delete
  @Output() filterChanged = new EventEmitter<void>();

  // Internal search model (two-way binding support)
  @Output() searchValueChange = new EventEmitter<string>();
  @Output() selectedMonthChange = new EventEmitter<number | null>();
  @Output() selectedYearChange = new EventEmitter<number | null>();
  @Output() selectedCategoryChange = new EventEmitter<number | null>();
  @Output() selectedPaymentTypeChange = new EventEmitter<number | null>();
  @Output() selectedTagIdsChange = new EventEmitter<number[]>();

  // Internal state
  private gridApi!: GridApi;
  Math = Math;
  themeService = inject(ThemeService);

  // AG Grid Theme - Dynamic based on theme service
  theme = computed(() => {
    const isDark = this.themeService.isDarkMode();

    if (isDark) {
      return themeQuartz.withPart(colorSchemeDark).withParams({
        backgroundColor: 'transparent',
        headerBackgroundColor: '#121212',
        borderColor: '#27272a',
        oddRowBackgroundColor: 'rgba(255, 255, 255, 0.01)',
        headerTextColor: '#71717a',
        foregroundColor: '#e4e4e7',
        rowHoverColor: 'rgba(62, 207, 142, 0.05)',
        fontFamily: "'Roboto', sans-serif",
        fontSize: '13px',
      });
    } else {
      return themeQuartz.withPart(colorSchemeLight).withParams({
        backgroundColor: '#ffffff',
        headerBackgroundColor: '#f8f9fa',
        borderColor: '#e5e7eb',
        oddRowBackgroundColor: '#fafafa',
        headerTextColor: '#71717a',
        foregroundColor: '#18181b',
        rowHoverColor: 'rgba(62, 207, 142, 0.1)',
        fontFamily: "'Roboto', sans-serif",
        fontSize: '13px',
      });
    }
  });

  ngOnInit() {
    console.log('🏗️ DataTable initialized with rowData:', this.rowData?.length);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['rowData']) {
      console.log('🔄 DataTable rowData changed:', changes['rowData'].currentValue?.length, 'rows');
      // Auto-set totalRecords from rowData length if not explicitly provided
      if (this.totalRecords === 0 && this.rowData && this.rowData.length > 0) {
        this.totalRecords = this.rowData.length;
        console.log('📊 Auto-set totalRecords to:', this.totalRecords);
      }
    }
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
    console.log('✅ AG Grid ready with', this.rowData?.length, 'rows');
    console.log('📋 Column defs:', this.columnDefs?.length, 'columns');
    console.log(
      '📋 Columns:',
      this.columnDefs.map((c) => c.field || c.headerName)
    );
    console.log('📊 First row data:', this.rowData?.[0]);
    this.gridReady.emit(params);

    // Force grid to refresh and auto-size columns
    setTimeout(() => {
      if (this.gridApi) {
        this.gridApi.refreshCells();
        this.gridApi.sizeColumnsToFit();
      }
    }, 100);
  }

  onSortChanged(event: any) {
    if (!this.gridApi) return;
    const sortState = this.gridApi.getColumnState().find((s) => s.sort != null);
    if (sortState) {
      this.sortChanged.emit({
        field: sortState.colId,
        order: sortState.sort as 'asc' | 'desc',
      });
    }
  }

  onRowClicked(event: any) {
    this.cellClicked.emit(event); // Emit full event for action handling
    this.rowClicked.emit(event.data); // Keep backward compatibility
  }

  onSearchChange() {
    this.searchValueChange.emit(this.searchValue);
    this.filterChanged.emit();
  }

  onMonthChange(value?: string | number | null) {
    if (value !== undefined) {
      this.selectedMonth = value as number | null;
    }
    this.selectedMonthChange.emit(this.selectedMonth);
    this.filterChanged.emit();
  }

  onYearChange(value?: string | number | null) {
    if (value !== undefined) {
      this.selectedYear = value as number | null;
    }
    this.selectedYearChange.emit(this.selectedYear);
    this.filterChanged.emit();
  }

  onCategoryChange(value?: string | number | null) {
    if (value !== undefined) {
      this.selectedCategory = value as number | null;
    }
    this.selectedCategoryChange.emit(this.selectedCategory);
    this.filterChanged.emit();
  }

  onPaymentTypeChange(value?: string | number | null) {
    if (value !== undefined) {
      this.selectedPaymentType = value as number | null;
    }
    this.selectedPaymentTypeChange.emit(this.selectedPaymentType);
    this.filterChanged.emit();
  }

  onTagsChange(value: (string | number)[]) {
    this.selectedTagIds = value as number[];
    this.selectedTagIdsChange.emit(this.selectedTagIds);
    this.filterChanged.emit();
  }

  clearFilters() {
    this.searchValue = '';
    this.selectedMonth = null;
    this.selectedYear = new Date().getFullYear();
    this.selectedCategory = null;
    this.selectedPaymentType = null;
    this.selectedTagIds = [];

    this.searchValueChange.emit(this.searchValue);
    this.selectedMonthChange.emit(this.selectedMonth);
    this.selectedYearChange.emit(this.selectedYear);
    this.selectedCategoryChange.emit(this.selectedCategory);
    this.selectedPaymentTypeChange.emit(this.selectedPaymentType);
    this.selectedTagIdsChange.emit(this.selectedTagIds);
    this.filterChanged.emit();
  }

  get hasActiveFilters(): boolean {
    return (
      !!this.searchValue ||
      this.selectedMonth !== null ||
      this.selectedYear !== new Date().getFullYear() ||
      this.selectedCategory !== null ||
      this.selectedPaymentType !== null ||
      this.selectedTagIds.length > 0
    );
  }

  get tagsOptions(): MultiselectOption[] {
    return this.tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
    }));
  }

  get monthOptions(): SelectOption[] {
    return [
      { value: null, label: 'All Months' },
      ...this.months.map((m) => ({ value: m.value, label: m.label })),
    ];
  }

  get yearOptions(): SelectOption[] {
    return [
      { value: null, label: 'All Years' },
      ...this.years.map((y) => ({ value: y, label: y.toString() })),
    ];
  }

  get categoryOptions(): SelectOption[] {
    return [
      { value: null, label: 'All Categories' },
      ...this.categories.map((c) => ({ value: c.id, label: c.name, description: c.description })),
    ];
  }

  get paymentTypeOptions(): SelectOption[] {
    return [
      { value: null, label: 'All Accounts' },
      ...this.paymentTypes.map((p) => ({ value: p.id, label: p.name })),
    ];
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages || this.loading) return;
    this.pageChanged.emit(page);
  }

  get totalPages(): number {
    return Math.ceil(this.totalRecords / this.pageSize) || 1;
  }

  get visiblePages(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const maxVisible = 5;

    if (total <= maxVisible) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }
}
