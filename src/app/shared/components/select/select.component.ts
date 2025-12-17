import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  OnInit,
  HostListener,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
  value: string | number | null;
  label: string;
}

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
})
export class SelectComponent implements ControlValueAccessor, OnInit {
  @Input() options: SelectOption[] = [];
  @Input() placeholder: string = 'Select...';
  @Input() label: string = '';
  @Input() bgColor: string = 'bg-dark-blue'; // Default dark blue
  @Output() selectionChange = new EventEmitter<string | number | null>();

  selectedValue: string | number | null = null;
  isOpen = false;

  private onChange = (value: string | number | null) => {};
  private onTouched = () => {};

  constructor(private elementRef: ElementRef) {}

  ngOnInit() {}

  writeValue(value: string | number | null): void {
    this.selectedValue = value;
  }

  registerOnChange(fn: (value: string | number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  selectOption(option: SelectOption): void {
    this.selectedValue = option.value;
    this.isOpen = false;
    this.onChange(this.selectedValue);
    this.onTouched();
    this.selectionChange.emit(this.selectedValue);
  }

  getSelectedLabel(): string {
    if (this.selectedValue === null) {
      return this.placeholder;
    }
    const option = this.options.find((opt) => opt.value === this.selectedValue);
    return option?.label || this.placeholder;
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.onTouched();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isOpen && !this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
}


