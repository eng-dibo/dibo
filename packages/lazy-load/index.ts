import {
  Directive,
  Input,
  ElementRef,
  Renderer2,
  PLATFORM_ID,
  Inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface Options {
  root: any;
  rootMargin: string;
  threshold: number | Array<number>;
}

@Directive({
  // ,[src]
  selector: '[data-src],[data-srcset]',
})
export class LazyLoadDirective {
  @Input('options') options: Options;
  @Input('data-src') dataSrc?: string;
  @Input('data-srcset') dataSrcSet?: string;
  private observer: IntersectionObserver;
  private element;

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.element = this.elementRef.nativeElement;
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      if (window && 'IntersectionObserver' in window) {
        let opts = Object.assign({}, this.options || {});
        this.observer = new IntersectionObserver(
          (entries) =>
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                if (this.dataSrcSet && this.dataSrcSet.length > 0) {
                  // too: renderer2.setProperty VS renderer2.setAttribute
                  this.renderer.setProperty(
                    this.element,
                    'srcset',
                    this.dataSrcSet
                  );
                } else if (this.dataSrc && this.dataSrc.length > 0) {
                  this.renderer.setProperty(this.element, 'src', this.dataSrc);
                }

                this.observer.unobserve(this.element);
              }
            }),
          opts
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
