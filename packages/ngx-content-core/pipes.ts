import { Pipe, PipeTransform } from '@angular/core';
import * as fn from './pipes-functions';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'slug',
})
export class SlugPipe implements PipeTransform {
  // todo: transform(...args) causes an error, but transform(value,...args) not!
  transform(value: string, ...args: any[]): string {
    return fn.slug(value, ...args);
  }
}

@Pipe({
  name: 'html2text',
})
export class Html2textPipe implements PipeTransform {
  transform(value: string, ...args: any[]): string {
    return fn.html2text(value, ...args);
  }
}

@Pipe({
  name: 'length',
})
export class LengthPipe implements PipeTransform {
  transform(value: string, ...args: any[]): string {
    return fn.length(value, ...args);
  }
}

@Pipe({
  name: 'nl2br',
})
export class Nl2brPipe implements PipeTransform {
  transform(value: string): string {
    return fn.nl2br(value);
  }
}

@Pipe({ name: 'keepHtml', pure: false })
export class KeepHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  transform(value: string): SafeHtml {
    return fn.keepHtml(value, this.sanitizer);
  }
}

@Pipe({ name: 'hypernate' })
export class HypernatePipe implements PipeTransform {
  transform(value: string): string {
    return fn.hypernate(value);
  }
}
