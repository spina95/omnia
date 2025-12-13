# Data Table Component

A highly reusable AG Grid-based data table component with built-in support for:
- ✅ **Pagination** - Client-side or server-side pagination with customizable page size
- ✅ **Sorting** - Column sorting with configurable sort fields
- ✅ **Filtering** - Multiple filter types (search, select dropdowns, date filters)
- ✅ **Loading States** - Built-in loading overlay and error handling
- ✅ **Row Selection** - Optional multi-row selection with checkbox column
- ✅ **Dark Theme** - Beautiful dark theme with customizable styling
- ✅ **Responsive** - Mobile-friendly design with responsive filters

## Location

```
src/app/shared/components/data-table/
├── data-table.component.ts
├── data-table.component.html
└── data-table.component.css
```

## Basic Usage

### 1. Import the Component

```typescript
import { DataTableComponent, FilterConfig } from '../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-my-page',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  // ...
})
```

### 2. Define Column Definitions

```typescript
columnDefs: ColDef[] = [
  {
    field: 'name',
    headerName: 'Name',
    flex: 1,
    cellStyle: { fontWeight: '500' }
  },
  {
    field: 'amount',
    headerName: 'Amount',
    width: 120,
    valueFormatter: params => {
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD' 
      }).format(params.value);
    }
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 100,
    cellRenderer: (params: any) => {
      const color = params.value === 'active' ? '#22c55e' : '#ef4444';
      return `<span style="color: ${color}">${params.value}</span>`;
    }
  }
];
```

### 3. Configure Filters (Optional)

```typescript
filterConfigs: FilterConfig[] = [
  {
    type: 'search',
    modelKey: 'search',
    placeholder: 'Search by name...',
    width: 'w-64'
  },
  {
    type: 'select',
    modelKey: 'status',
    label: 'All Status',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' }
    ],
    width: 'w-40'
  },
  {
    type: 'date-year',
    modelKey: 'year',
    label: 'All Years',
    options: [2024, 2023, 2022].map(y => ({ value: y, label: y.toString() }))
  }
];
```

### 4. Use in Template

```html
<app-data-table
  title="My Data"
  [columnDefs]="columnDefs"
  [rowData]="rowData"
  [loading]="isLoading"
  [error]="errorMessage"
  [currentPage]="currentPage"
  [pageSize]="pageSize"
  [totalRecords]="totalRecords"
  [filterConfigs]="filterConfigs"
  [showAddButton]="true"
  addButtonText="+ Add New"
  (gridReady)="onGridReady()"
  (sortChanged)="onSortChanged($event)"
  (pageChanged)="onPageChanged($event)"
  (filterChanged)="onFilterChanged($event)"
  (addClicked)="onAdd()"
></app-data-table>
```

### 5. Handle Events in Component

```typescript
onGridReady() {
  this.loadData();
}

onSortChanged(event: SortChangeEvent) {
  this.currentSort = event.field;
  this.currentOrder = event.order;
  this.loadData();
}

onPageChanged(event: PaginationChangeEvent) {
  this.currentPage = event.page;
  this.loadData();
}

onFilterChanged(event: FilterChangeEvent) {
  this.filters = event.filters;
  this.currentPage = 1; // Reset to first page
  this.loadData();
}

onAdd() {
  // Handle add button click
}
```

## Input Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `columnDefs` | `ColDef[]` | `[]` | AG Grid column definitions |
| `defaultColDef` | `ColDef` | See component | Default column configuration |
| `rowData` | `any[]` | `[]` | Array of row data to display |
| `loading` | `boolean` | `false` | Shows loading overlay when true |
| `error` | `string \| null` | `null` | Error message to display |
| `currentPage` | `number` | `1` | Current page number |
| `pageSize` | `number` | `20` | Number of rows per page |
| `totalRecords` | `number` | `0` | Total number of records (for pagination) |
| `showPagination` | `boolean` | `true` | Show/hide pagination controls |
| `filterConfigs` | `FilterConfig[]` | `[]` | Filter configurations |
| `showClearFilters` | `boolean` | `true` | Show/hide clear filters button |
| `enableRowSelection` | `boolean` | `false` | Enable row selection with checkboxes |
| `title` | `string` | `''` | Table title |
| `showHeader` | `boolean` | `true` | Show/hide header section |
| `showAddButton` | `boolean` | `false` | Show/hide add button |
| `addButtonText` | `string` | `'+ New'` | Text for add button |
| `headerHeight` | `number` | `48` | Height of grid header in pixels |
| `rowHeight` | `number` | `52` | Height of each row in pixels |
| `emptyStateMessage` | `string` | `'No records found...'` | Message shown when no data |

## Output Events

| Event | Type | Description |
|-------|------|-------------|
| `gridReady` | `GridReadyEvent` | Emitted when AG Grid is ready |
| `sortChanged` | `SortChangeEvent` | Emitted when sorting changes |
| `pageChanged` | `PaginationChangeEvent` | Emitted when page changes |
| `filterChanged` | `FilterChangeEvent` | Emitted when any filter changes |
| `addClicked` | `void` | Emitted when add button is clicked |
| `rowsSelected` | `any[]` | Emitted when row selection changes |

## Filter Types

### Search Filter
```typescript
{
  type: 'search',
  modelKey: 'searchQuery',
  placeholder: 'Search...',
  width: 'w-64' // Optional Tailwind width class
}
```

### Select Filter
```typescript
{
  type: 'select',
  modelKey: 'category',
  label: 'All Categories',
  options: [
    { value: 1, label: 'Category 1' },
    { value: 2, label: 'Category 2' }
  ],
  width: 'w-40'
}
```

### Date Month Filter
```typescript
{
  type: 'date-month',
  modelKey: 'month',
  label: 'All Months',
  options: [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    // ...
  ]
}
```

### Date Year Filter
```typescript
{
  type: 'date-year',
  modelKey: 'year',
  label: 'All Years',
  options: [
    { value: 2024, label: '2024' },
    { value: 2023, label: '2023' }
  ]
}
```

## Advanced Customization

### Custom Cell Renderers

Use AG Grid's `cellRenderer` property for custom cell display:

```typescript
{
  field: 'tags',
  headerName: 'Tags',
  cellRenderer: (params: any) => {
    const tags = params.value || [];
    return tags.map((tag: string) => 
      `<span class="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">${tag}</span>`
    ).join(' ');
  }
}
```

### Custom Styling

Override the default theme in your component:

```typescript
import { themeQuartz, colorSchemeDark } from 'ag-grid-community';

// In component
this.theme = themeQuartz
  .withPart(colorSchemeDark)
  .withParams({
    backgroundColor: '#000000',
    headerBackgroundColor: '#18181b',
    // ... other params
  });
```

## Example: Outcomes Page

See the refactored example in:
- `src/app/features/finance/outcomes/outcomes-refactored.ts.example`
- `src/app/features/finance/outcomes/outcomes-refactored.html.example`

This shows how the original 420-line component can be reduced to ~200 lines by using the reusable table component!

## Tips

1. **Server-side pagination**: Update `totalRecords` from your API response
2. **Client-side filtering**: Keep all data in `rowData` and let AG Grid handle filtering
3. **Performance**: Use `trackBy` functions for large datasets
4. **Accessibility**: Column headers are automatically ARIA-labeled
5. **Mobile**: Filters automatically stack on smaller screens

## Future Enhancements

Potential improvements:
- [ ] Export to CSV/Excel
- [ ] Column visibility toggle
- [ ] Saved filter presets
- [ ] Row actions menu
- [ ] Inline editing
- [ ] Drag-and-drop row reordering
