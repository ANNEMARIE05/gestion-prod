import {
  Directive,
  ElementRef,
  Input,
  Renderer2,
  OnChanges,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';

/**
 * Directive `appBtnLoading` : ajoute un spinner SVG dans n'importe quel
 * `<button>` et désactive le bouton tant que la valeur est `true`.
 *
 * Exemple :
 * ```html
 * <button mat-flat-button [appBtnLoading]="saving()" (click)="save()">
 *   Enregistrer
 * </button>
 * ```
 */
@Directive({
  selector: '[appBtnLoading]',
  standalone: true,
})
export class ButtonLoadingDirective implements OnChanges, OnDestroy {
  @Input('appBtnLoading') loading: boolean | null | undefined = false;

  /** Texte affiché à côté du spinner. Si vide, on garde le label original. */
  @Input() loadingText: string | null = null;

  /** Diamètre du spinner en pixels. */
  @Input() spinnerSize = 16;

  private spinnerEl: HTMLElement | null = null;
  private originalDisabled: boolean | null = null;
  private wasDisabledAttr = false;
  private originalCursor: string | null = null;
  private originalPointerEvents: string | null = null;
  private originalLabelHtml: string | null = null;

  constructor(
    private readonly el: ElementRef<HTMLButtonElement>,
    private readonly renderer: Renderer2,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ('loading' in changes) {
      this.applyLoadingState(!!this.loading);
    }
  }

  ngOnDestroy(): void {
    this.removeSpinner();
  }

  private applyLoadingState(isLoading: boolean): void {
    const btn = this.el.nativeElement;
    if (!btn) return;

    if (isLoading) {
      if (this.originalDisabled === null) {
        this.originalDisabled = btn.disabled;
        this.wasDisabledAttr = btn.hasAttribute('disabled');
        this.originalCursor = btn.style.cursor || null;
        this.originalPointerEvents = btn.style.pointerEvents || null;
      }

      this.renderer.setProperty(btn, 'disabled', true);
      this.renderer.setAttribute(btn, 'aria-busy', 'true');
      this.renderer.setStyle(btn, 'cursor', 'wait');
      this.renderer.setStyle(btn, 'pointer-events', 'none');
      this.renderer.addClass(btn, 'is-loading');

      this.injectSpinner(btn);
    } else {
      if (this.originalDisabled !== null) {
        this.renderer.setProperty(btn, 'disabled', this.originalDisabled);
        if (!this.wasDisabledAttr) {
          this.renderer.removeAttribute(btn, 'disabled');
        }
      }
      this.renderer.removeAttribute(btn, 'aria-busy');
      if (this.originalCursor !== null) {
        this.renderer.setStyle(btn, 'cursor', this.originalCursor);
      } else {
        this.renderer.removeStyle(btn, 'cursor');
      }
      if (this.originalPointerEvents !== null) {
        this.renderer.setStyle(btn, 'pointer-events', this.originalPointerEvents);
      } else {
        this.renderer.removeStyle(btn, 'pointer-events');
      }
      this.renderer.removeClass(btn, 'is-loading');

      this.removeSpinner();

      this.originalDisabled = null;
      this.wasDisabledAttr = false;
      this.originalCursor = null;
      this.originalPointerEvents = null;
    }
  }

  private injectSpinner(btn: HTMLElement): void {
    if (this.spinnerEl) return;

    if (this.loadingText !== null) {
      const labelHost = (btn.querySelector('.mdc-button__label') as HTMLElement | null) ?? btn;
      this.originalLabelHtml = labelHost.innerHTML;
      labelHost.innerHTML = '';
    }

    const wrapper = this.renderer.createElement('span') as HTMLElement;
    this.renderer.setAttribute(wrapper, 'class', 'app-btn-loader');
    this.renderer.setStyle(wrapper, 'display', 'inline-flex');
    this.renderer.setStyle(wrapper, 'align-items', 'center');
    this.renderer.setStyle(wrapper, 'justify-content', 'center');
    this.renderer.setStyle(wrapper, 'gap', '0.5rem');
    this.renderer.setStyle(wrapper, 'vertical-align', 'middle');

    const svgNs = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNs, 'svg');
    svg.setAttribute('class', 'app-btn-loader__spinner');
    svg.setAttribute('width', String(this.spinnerSize));
    svg.setAttribute('height', String(this.spinnerSize));
    svg.setAttribute('viewBox', '0 0 50 50');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.animation = 'app-btn-loader-rotate 0.9s linear infinite';
    svg.style.flexShrink = '0';

    const circleBg = document.createElementNS(svgNs, 'circle');
    circleBg.setAttribute('cx', '25');
    circleBg.setAttribute('cy', '25');
    circleBg.setAttribute('r', '20');
    circleBg.setAttribute('fill', 'none');
    circleBg.setAttribute('stroke', 'currentColor');
    circleBg.setAttribute('stroke-opacity', '0.25');
    circleBg.setAttribute('stroke-width', '5');

    const circleFg = document.createElementNS(svgNs, 'circle');
    circleFg.setAttribute('cx', '25');
    circleFg.setAttribute('cy', '25');
    circleFg.setAttribute('r', '20');
    circleFg.setAttribute('fill', 'none');
    circleFg.setAttribute('stroke', 'currentColor');
    circleFg.setAttribute('stroke-width', '5');
    circleFg.setAttribute('stroke-linecap', 'round');
    circleFg.setAttribute('stroke-dasharray', '90 150');
    circleFg.setAttribute('stroke-dashoffset', '0');

    svg.appendChild(circleBg);
    svg.appendChild(circleFg);
    wrapper.appendChild(svg);

    if (this.loadingText !== null && this.loadingText.trim().length > 0) {
      const textNode = this.renderer.createElement('span') as HTMLElement;
      textNode.textContent = this.loadingText;
      textNode.style.fontSize = 'inherit';
      wrapper.appendChild(textNode);
    }

    this.ensureKeyframes();

    if (this.loadingText !== null) {
      const labelHost = (btn.querySelector('.mdc-button__label') as HTMLElement | null) ?? btn;
      this.renderer.appendChild(labelHost, wrapper);
    } else {
      this.renderer.insertBefore(btn, wrapper, btn.firstChild);
    }
    this.spinnerEl = wrapper;
  }

  private removeSpinner(): void {
    if (this.spinnerEl && this.spinnerEl.parentNode) {
      this.renderer.removeChild(this.spinnerEl.parentNode, this.spinnerEl);
    }
    this.spinnerEl = null;

    if (this.originalLabelHtml !== null) {
      const btn = this.el.nativeElement;
      const labelHost = (btn?.querySelector('.mdc-button__label') as HTMLElement | null) ?? btn;
      if (labelHost) {
        labelHost.innerHTML = this.originalLabelHtml;
      }
      this.originalLabelHtml = null;
    }
  }

  private ensureKeyframes(): void {
    if (typeof document === 'undefined') return;
    const id = 'app-btn-loader-keyframes';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `@keyframes app-btn-loader-rotate { 100% { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
  }
}
