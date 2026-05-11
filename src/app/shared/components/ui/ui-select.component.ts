import { CommonModule } from '@angular/common';
import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface UiSelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-ui-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiSelectComponent),
      multi: true,
    },
  ],
  template: `
    <select
      [id]="id"
      [name]="name"
      [disabled]="isDisabled || disabled"
      [required]="required"
      [value]="value"
      (change)="onSelect($event)"
      (blur)="onBlur()"
      [class]="selectClasses"
    >
      <option *ngIf="placeholder" value="" [disabled]="placeholderDisabled">{{ placeholder }}</option>
      <option
        *ngFor="let option of options; trackBy: trackByValue"
        [value]="option.value"
        [disabled]="option.disabled"
      >
        {{ option.label }}
      </option>
    </select>
  `,
})
export class UiSelectComponent implements ControlValueAccessor {
  @Input() id = '';
  @Input() name = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() fullWidth = true;
  @Input() placeholder = '';
  @Input() placeholderDisabled = true;
  @Input() options: UiSelectOption[] = [];

  value = '';
  isDisabled = false;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  get selectClasses(): string {
    const widthClass = this.fullWidth ? 'w-full' : '';
    return `${widthClass} h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`;
  }

  writeValue(value: string | null): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  onSelect(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.value = target.value;
    this.onChange(this.value);
  }

  onBlur(): void {
    this.onTouched();
  }

  trackByValue(_index: number, option: UiSelectOption): string {
    return option.value;
  }
}
