import {
  Directive,
  ElementRef,
  Inject,
  Input,
  PLATFORM_ID,
  Renderer2,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface Options {
  root: any;
  rootMargin: string;
  threshold: number | Array<number>;
}

@Directive({
  selector: '[data-src],[data-srcset],[data-lazy]',
})
export class LazyLoadDirective {
  @Input('options') options: Options;
  @Input('data-src') dataSrc?: string;
  @Input('data-srcset') dataSrcSet?: string;
  private observer: IntersectionObserver;
  private element;

  constructor(
    private elementReference: ElementRef,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.element = this.elementRef.nativeElement;
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      if (window && 'IntersectionObserver' in window) {
        let options = Object.assign({}, this.options || {});
        this.observer = new IntersectionObserver(
          (entries) =>
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                if (this.dataSrcSet && this.dataSrcSet.length > 0) {
                  // todo: renderer2.setProperty VS renderer2.setAttribute
                  this.renderer.setProperty(
                    this.element,
                    'srcset',
                    this.dataSrcSet
                  );
                } else if (this.dataSrc && this.dataSrc.length > 0) {
                  this.renderer.setProperty(this.element, 'src', this.dataSrc);
                }
                // set data-lazy="intersecting", so the consumer can perform actions in response of this value
                // example: `<div data-lazy><div *ngIf="parent.getAttribute(data-lazy)==='isIntersecting'"></div></div>W
                this.renderer.setAttribute(
                  this.element,
                  'data-lazy',
                  'isIntersecting'
                );
                this.observer.unobserve(this.element);
              }
            }),
          options
        );

        this.observer.observe(this.element);
      } else if (this.dataSrc) {
        console.warn(
          'IntersectionObserver is not supported. update your browser'
        );
        this.renderer.setProperty(this.element, 'src', this.dataSrc);
      }
    }
  }
}
