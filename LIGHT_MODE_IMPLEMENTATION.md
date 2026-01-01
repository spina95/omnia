# Light Mode Implementation - Status & Guide

## ✅ Completato

### 1. **Core Infrastructure**
- ✅ `ThemeService` creato in `core/services/theme.service.ts`
  - Signal `isDarkMode()` per stato reattivo
  - Persistenza in localStorage
  - Applicazione automatica classe `dark` su `document.documentElement`
  - Metodi: `toggleTheme()`, `setLightMode()`, `setDarkMode()`

- ✅ Configurazione Tailwind aggiornata (`tailwind.config.js`)
  - Strategia `darkMode: 'class'` attivata
  - Colori light mode aggiunti:
    - `sidebar-light`: `#f8f9fa`
    - `sidebar-border-light`: `#e5e7eb`
    - `sidebar-hover-light`: `#e8e9eb`
    - `background-light`: `#ffffff`
    - `background-card-light`: `#f5f5f5`
    - `dark-blue-light`: `#f3f4f6`

- ✅ Stili globali aggiornati (`src/styles.css`)
  - Body con `bg-white dark:bg-background`
  - Scrollbar responsive per light/dark mode
  - Transizioni `duration-200` per cambio tema fluido

### 2. **UI Components**
- ✅ **Theme Toggle Component** (`shared/components/theme-toggle/`)
  - Icone sole/luna dinamiche
  - Integrato nella sidebar prima del logout
  - Label "Modalità Chiara/Scura" responsive

- ✅ **Layout Components**
  - `sidebar.component.ts`: Tutti i colori con varianti `dark:`
  - `main-layout.component.ts`: Background, borders, testi responsive

- ✅ **Shared Components**
  - `data-table`: AG Grid con tema dinamico (computed signal)
  - `select`: Dropdown con colori light/dark
  - `multiselect`: Checkbox e tags responsive
  - Tutti con transizioni `duration-200`

### 3. **Charts (AG Grid)**
- ✅ DataTableComponent: Tema AG Grid dinamico
  ```typescript
  theme = computed(() => {
    const isDark = this.themeService.isDarkMode();
    return isDark 
      ? themeQuartz.withPart(colorSchemeDark).withParams({...})
      : themeQuartz.withPart(colorSchemeLight).withParams({...});
  });
  ```

## ⚠️ Da Completare

### 1. **ApexCharts in HomeComponent**
Sono state aggiunte le basi:
```typescript
private themeService = inject(ThemeService);
chartThemeMode = computed(() => this.themeService.isDarkMode() ? 'dark' : 'light');
```

**Action Required**: Sostituire in tutti i chart options:
```typescript
// PRIMA:
tooltip: { theme: 'dark' }
theme: { mode: 'dark' }

// DOPO:
tooltip: { theme: this.chartThemeMode() }
theme: { mode: this.chartThemeMode() }
```

**Files da aggiornare** (circa 15 occorrenze):
- `src/app/features/home/home/home.component.ts`
  - Line 527: `tooltip.theme`
  - Line 538: `theme.mode`
  - Line 634: `tooltip.theme`
  - Line 645: `theme.mode`
  - Line 732: `tooltip.theme`
  - Line 742: `theme.mode`
  - Line 774: `theme.mode`
  - Line 902: `tooltip.theme`
  - Line 917: `theme.mode`

### 2. **Plotly Charts (Sankey in HomeComponent)**
**Action Required**: Aggiornare layout paper/plot background e forecolor:
```typescript
// Esempio - Aggiornare in base a isDarkMode()
this.sankeyChartLayout = {
  paper_bgcolor: this.themeService.isDarkMode() ? 'transparent' : '#ffffff',
  plot_bgcolor: this.themeService.isDarkMode() ? 'transparent' : '#ffffff',
  font: {
    color: this.themeService.isDarkMode() ? '#e5e7eb' : '#18181b'
  }
};
```

### 3. **Features Components (HTML Templates)**
Molti componenti in `src/app/features/` hanno ancora classi hardcoded.

**Pattern da applicare** (circa 50+ file):
```html
<!-- PRIMA -->
<div class="bg-background-card border border-zinc-800 text-white">

<!-- DOPO -->
<div class="bg-white dark:bg-background-card border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-white transition-colors duration-200">
```

**Componenti prioritari da aggiornare**:
- ✅ `features/home/home/home.html` - Dashboard principale
- ⚠️ `features/planner/day-view/` - Planner UI
- ⚠️ `features/videos/videos.component.html` - Video gallery
- ⚠️ `features/todos/` - Todo lists
- ⚠️ `features/documents/` - Document viewer
- ⚠️ `features/finance/budgets/` - Budget cards
- ⚠️ `features/finance/investments/` - Investment charts
- ⚠️ `features/finance/travel-map/` - Travel map & dialogs

### 4. **Dialogs & Modals**
Dialog components richiedono aggiornamento background/borders:
- `expense-dialog.component.html`
- `income-dialog.component.html`
- `confirmation-dialog.component.html`
- `manage-tags-dialog.component.html`
- Feature-specific dialogs (add-video, upload-document, etc.)

**Pattern dialog**:
```html
<div class="bg-white dark:bg-background-card border border-zinc-300 dark:border-zinc-800 rounded-lg shadow-2xl transition-colors duration-200">
  <h2 class="text-zinc-900 dark:text-white">Title</h2>
  <input class="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-700">
</div>
```

## 🎨 Design System Reference

### Color Mapping
| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| **Backgrounds** |
| Main | `bg-white` | `dark:bg-background` (#151515) |
| Card | `bg-zinc-50` | `dark:bg-background-card` (#191919) |
| Sidebar | `bg-sidebar-light` (#f8f9fa) | `dark:bg-sidebar` (#141414) |
| **Borders** |
| Default | `border-zinc-300` | `dark:border-zinc-800` |
| Sidebar | `border-sidebar-border-light` (#e5e7eb) | `dark:border-sidebar-border` (#2a2a2a) |
| **Text** |
| Primary | `text-zinc-900` | `dark:text-zinc-100` |
| Secondary | `text-zinc-700` | `dark:text-zinc-300` |
| Muted | `text-zinc-500` | `dark:text-zinc-500` |
| **Inputs** |
| Background | `bg-white` | `dark:bg-zinc-950` |
| Border | `border-zinc-300` | `dark:border-zinc-700` |
| Placeholder | `placeholder-zinc-400` | `dark:placeholder-zinc-500` |
| **Hover States** |
| Sidebar | `hover:bg-sidebar-hover-light` (#e8e9eb) | `dark:hover:bg-sidebar-hover` (#232323) |
| Generic | `hover:bg-zinc-200` | `dark:hover:bg-zinc-800` |

### Transitions
Sempre aggiungere `transition-colors duration-200` per cambio fluido

### Brand Colors (Invariati)
- Brand verde: `#3ECF8E` - sempre uguale in light/dark
- Brand hover: `rgba(62, 207, 142, 0.1/0.2/0.3)` - trasparenze adattate

## 🛠️ Helper Commands

### Find Components to Update
```bash
# Trova tutti i template con bg-background-card
grep -r "bg-background-card" src/app/features --include="*.html"

# Trova text-white hardcoded
grep -r "text-white" src/app/features --include="*.html" | grep -v "dark:text-white"

# Trova border-zinc-800 hardcoded
grep -r "border-zinc-800" src/app/features --include="*.html" | grep -v "dark:border-zinc-800"
```

### Global Replace Patterns (use with caution!)
```bash
# Example: Replace simple cases (verify before applying!)
find src/app/features -name "*.html" -exec sed -i '' 's/bg-background-card /bg-white dark:bg-background-card /g' {} \;
```

## ✅ Testing Checklist

1. **Toggle Functionality**
   - [ ] Toggle button in sidebar funziona
   - [ ] Preferenza persiste dopo refresh
   - [ ] Transizioni fluide (200ms)

2. **Core Components**
   - [x] Sidebar colori corretti light/dark
   - [x] Main layout background responsive
   - [x] Data table tema switchato
   - [x] Select/Multiselect dropdowns corretti

3. **Charts**
   - [x] AG Grid (data-table) tema dinamico
   - [ ] ApexCharts seguono tema (HomeComponent)
   - [ ] Plotly Sankey colori adattati

4. **Features** (Sample Testing)
   - [ ] Dashboard leggibile in light mode
   - [ ] Planner day-view contrasti OK
   - [ ] Videos gallery visivamente corretta
   - [ ] Dialogs con sfondo giusto

## 📝 Notes

- **Performance**: I `computed()` signals sono reattivi e ottimizzati
- **Consistency**: Usare sempre le classi Tailwind configurate, non hex diretti
- **Accessibility**: Verificare contrasto colori in light mode (WCAG AA)
- **Browser**: Testare su Chrome, Safari, Firefox

## 🔗 Resources

- Tailwind Dark Mode Docs: https://tailwindcss.com/docs/dark-mode
- Angular Signals: https://angular.io/guide/signals
- ApexCharts Theming: https://apexcharts.com/docs/options/theme/

---

**Creato il**: 1 gennaio 2026  
**Versione**: 1.0 - Implementazione parziale completata
