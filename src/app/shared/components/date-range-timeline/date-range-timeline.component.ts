import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  OnInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface DateRange {
  startDate: string;
  endDate: string;
}

@Component({
  selector: 'app-date-range-timeline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './date-range-timeline.component.html',
  styleUrls: ['./date-range-timeline.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateRangeTimelineComponent),
      multi: true,
    },
  ],
})
export class DateRangeTimelineComponent implements ControlValueAccessor, OnInit, OnChanges, OnDestroy {
  @Input() minDate: string = '2022-01-01';
  @Input() maxDate: string = new Date().toISOString().split('T')[0];
  @Output() rangeChange = new EventEmitter<DateRange>();

  // Timeline state
  startPosition = 0;
  endPosition = 100;
  
  // Internal date values
  private _startDate: string = '';
  private _endDate: string = '';

  // Total days in range
  private totalDays = 0;
  private minDateMs = 0;
  private maxDateMs = 0;

  // Year markers for display
  yearMarkers: { position: number; year: number }[] = [];

  // Drag state
  private isDraggingStart = false;
  private isDraggingEnd = false;
  private trackElement: HTMLElement | null = null;

  private onChange = (value: DateRange | null) => {};
  private onTouched = () => {};

  ngOnInit() {
    this.initializeTimeline();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['minDate'] || changes['maxDate']) {
      this.initializeTimeline();
    }
  }

  private initializeTimeline() {
    this.minDateMs = new Date(this.minDate).getTime();
    this.maxDateMs = new Date(this.maxDate).getTime();
    this.totalDays = Math.floor((this.maxDateMs - this.minDateMs) / (1000 * 60 * 60 * 24));

    // Calculate year markers
    this.calculateYearMarkers();

    // Initialize positions if dates are not set
    if (!this._startDate || !this._endDate) {
      this._startDate = this.minDate;
      this._endDate = this.maxDate;
      this.startPosition = 0;
      this.endPosition = 100;
    }
  }

  private calculateYearMarkers() {
    const markers: { position: number; year: number }[] = [];
    const startYear = new Date(this.minDate).getFullYear();
    const endYear = new Date(this.maxDate).getFullYear();

    for (let year = startYear; year <= endYear; year++) {
      const yearDate = new Date(year, 0, 1);
      const yearMs = yearDate.getTime();
      
      if (yearMs >= this.minDateMs && yearMs <= this.maxDateMs) {
        const position = ((yearMs - this.minDateMs) / (this.maxDateMs - this.minDateMs)) * 100;
        markers.push({ position, year });
      }
    }

    this.yearMarkers = markers;
  }

  writeValue(value: DateRange | null): void {
    if (value && value.startDate && value.endDate) {
      this._startDate = value.startDate;
      this._endDate = value.endDate;
      this.updatePositionsFromDates();
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  private updatePositionsFromDates() {
    const startMs = new Date(this._startDate).getTime();
    const endMs = new Date(this._endDate).getTime();
    
    this.startPosition = ((startMs - this.minDateMs) / (this.maxDateMs - this.minDateMs)) * 100;
    this.endPosition = ((endMs - this.minDateMs) / (this.maxDateMs - this.minDateMs)) * 100;
    
    // Clamp values
    this.startPosition = Math.max(0, Math.min(100, this.startPosition));
    this.endPosition = Math.max(0, Math.min(100, this.endPosition));
  }

  private updateDatesFromPositions() {
    const startMs = this.minDateMs + (this.startPosition / 100) * (this.maxDateMs - this.minDateMs);
    const endMs = this.minDateMs + (this.endPosition / 100) * (this.maxDateMs - this.minDateMs);
    
    this._startDate = this.formatDate(new Date(startMs));
    this._endDate = this.formatDate(new Date(endMs));
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onStartThumbMouseDown(event: MouseEvent) {
    event.preventDefault();
    this.isDraggingStart = true;
    this.trackElement = (event.target as HTMLElement).closest('.timeline-container') as HTMLElement;
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  onEndThumbMouseDown(event: MouseEvent) {
    event.preventDefault();
    this.isDraggingEnd = true;
    this.trackElement = (event.target as HTMLElement).closest('.timeline-container') as HTMLElement;
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  private onMouseMove = (event: MouseEvent) => {
    if (!this.isDraggingStart && !this.isDraggingEnd) return;
    if (!this.trackElement) return;

    const track = this.trackElement.querySelector('.timeline-track') as HTMLElement;
    if (!track) return;

    const rect = track.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));

    if (this.isDraggingStart) {
      this.startPosition = Math.min(percentage, this.endPosition);
      this.updateDatesFromPositions();
      this.emitChange();
    } else if (this.isDraggingEnd) {
      this.endPosition = Math.max(percentage, this.startPosition);
      this.updateDatesFromPositions();
      this.emitChange();
    }
  };

  private onMouseUp = () => {
    this.isDraggingStart = false;
    this.isDraggingEnd = false;
    this.trackElement = null;
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  };

  onTrackClick(event: MouseEvent) {
    if (this.isDraggingStart || this.isDraggingEnd) return;
    
    const track = event.currentTarget as HTMLElement;
    const rect = track.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));

    // Determine which thumb is closer
    const distanceToStart = Math.abs(percentage - this.startPosition);
    const distanceToEnd = Math.abs(percentage - this.endPosition);

    if (distanceToStart < distanceToEnd) {
      this.startPosition = Math.min(percentage, this.endPosition);
    } else {
      this.endPosition = Math.max(percentage, this.startPosition);
    }

    this.updateDatesFromPositions();
    this.emitChange();
  }

  ngOnDestroy() {
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  }

  private emitChange() {
    const range: DateRange = {
      startDate: this._startDate,
      endDate: this._endDate,
    };
    
    this.onChange(range);
    this.rangeChange.emit(range);
    this.onTouched();
  }

  get startDate(): string {
    return this._startDate;
  }

  get endDate(): string {
    return this._endDate;
  }

  get selectedRangeWidth(): number {
    return this.endPosition - this.startPosition;
  }

  get selectedRangeLeft(): number {
    return this.startPosition;
  }

  formatDisplayDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  }
}
