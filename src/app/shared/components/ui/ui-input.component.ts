import { CommonModule } from '@angular/common';
import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-ui-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiInputComponent),
      multi: true,
    },
  ],
  template: `
    <input
      [id]="id"
      [name]="name"
      [type]="type"
      [placeholder]="placeholder"
      [autocomplete]="autocomplete"
      [disabled]="isDisabled || disabled"
      [required]="required"
      [readOnly]="readonly"
      [value]="value"
      (input)="onInput($event)"
      (blur)="onBlur()"
      [class]="inputClasses"
    />
  `,
})
export class UiInputComponent implements ControlValueAccessor {
  @Input() id = '';
  @Input() name = '';
  @Input() type = 'text';
  @Input() placeholder = '';
  @Input() autocomplete = 'off';
  @Input() required = false;
  @Input() readonly = false;
  @Input() disabled = false;
  @Input() fullWidth = true;

  value = '';
  isDisabled = false;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  get inputClasses(): string {
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

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
  }

  onBlur(): void {
    this.onTouched();
  }
}
