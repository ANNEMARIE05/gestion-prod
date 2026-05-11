import { CommonModule } from '@angular/common';
import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-ui-textarea',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiTextareaComponent),
      multi: true,
    },
  ],
  template: `
    <textarea
      [id]="id"
      [name]="name"
      [placeholder]="placeholder"
      [rows]="rows"
      [disabled]="isDisabled || disabled"
      [required]="required"
      [readOnly]="readonly"
      [value]="value"
      (input)="onInput($event)"
      (blur)="onBlur()"
      [class]="textareaClasses"
    ></textarea>
  `,
})
export class UiTextareaComponent implements ControlValueAccessor {
  @Input() id = '';
  @Input() name = '';
  @Input() placeholder = '';
  @Input() rows = 4;
  @Input() required = false;
  @Input() readonly = false;
  @Input() disabled = false;
  @Input() fullWidth = true;

  value = '';
  isDisabled = false;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  get textareaClasses(): string {
    const widthClass = this.fullWidth ? 'w-full' : '';
    return `${widthClass} rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`;
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
    const target = event.target as HTMLTextAreaElement;
    this.value = target.value;
    this.onChange(this.value);
  }

  onBlur(): void {
    this.onTouched();
  }
}
