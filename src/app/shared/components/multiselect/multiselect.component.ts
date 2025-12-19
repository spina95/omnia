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

export interface MultiselectOption {
  id: number | string;
  name: string;
  color?: string;
}

@Component({
  selector: 'app-multiselect',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './multiselect.component.html',
  styleUrls: ['./multiselect.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultiselectComponent),
      multi: true,
    },
  ],
})
export class MultiselectComponent implements ControlValueAccessor, OnInit {
  @Input() options: MultiselectOption[] = [];
  @Input() placeholder: string = 'Select options...';
  @Input() label: string = '';
  @Output() selectionChange = new EventEmitter<(number | string)[]>();

  selectedIds: (number | string)[] = [];
  isOpen = false;
  dropdownWidth = 0;
  dropdownTop = 0;
  dropdownLeft = 0;

  private onChange = (value: (number | string)[]) => {};
  private onTouched = () => {};

  constructor(private elementRef: ElementRef) {}

  ngOnInit() {
    if (!this.selectedIds) {
      this.selectedIds = [];
    }
  }

  writeValue(value: (number | string)[]): void {
    this.selectedIds = value ? [...value] : [];
  }

  registerOnChange(fn: (value: (number | string)[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  toggleOption(optionId: number | string): void {
    const index = this.selectedIds.indexOf(optionId);
    if (index > -1) {
      this.selectedIds = this.selectedIds.filter((id) => id !== optionId);
    } else {
      this.selectedIds = [...this.selectedIds, optionId];
    }
    this.onChange([...this.selectedIds]);
    this.onTouched();
    this.selectionChange.emit([...this.selectedIds]);
  }

  isSelected(optionId: number | string): boolean {
    return this.selectedIds.includes(optionId);
  }

  getSelectedOptions(): MultiselectOption[] {
    return this.options.filter((opt) => this.selectedIds.includes(opt.id));
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.calculateDropdownPosition();
      this.onTouched();
    }
  }

  private calculateDropdownPosition(): void {
    const button = this.elementRef.nativeElement.querySelector('button');
    if (button) {
      const rect = button.getBoundingClientRect();
      this.dropdownWidth = rect.width;
      this.dropdownTop = rect.bottom + 4; // 4px margin
      this.dropdownLeft = rect.left;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isOpen && !this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  closeDropdown(): void {
    this.isOpen = false;
  }

  removeOption(optionId: number | string, event: Event): void {
    event.stopPropagation();
    this.toggleOption(optionId);
  }

  getDisplayText(): string {
    if (this.selectedIds.length === 0) {
      return this.placeholder;
    }
    if (this.selectedIds.length === 1) {
      const option = this.options.find((opt) => opt.id === this.selectedIds[0]);
      return option?.name || this.placeholder;
    }
    return `${this.selectedIds.length} selected`;
  }
}


