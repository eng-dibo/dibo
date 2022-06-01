import { Pipe, PipeTransform } from '@angular/core';
import * as function_ from './pipes-functions';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'slug',
})
export class SlugPipe implements PipeTransform {
  // todo: transform(...args) causes an error, but transform(value,...args) not!
  transform(value: string, ...arguments_: any[]): string {
    return function_.slug(value, ...arguments_);
  }
}

@Pipe({
  name: 'html2text',
})
export class Html2textPipe implements PipeTransform {
  transform(value: string, ...arguments_: any[]): string {
    return function_.html2text(value, ...arguments_);
  }
}

@Pipe({
  name: 'length',
})
export class LengthPipe implements PipeTransform {
  transform(value: string, ...arguments_: any[]): string {
    return function_.length(value, ...arguments_);
  }
}

@Pipe({
  name: 'nl2br',
})
export class Nl2brPipe implements PipeTransform {
  transform(value: string): string {
    return function_.nl2br(value);
  }
}

@Pipe({ name: 'keepHtml', pure: false })
export class KeepHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  transform(value: string): SafeHtml {
    return function_.keepHtml(value, this.sanitizer);
  }
}

@Pipe({ name: 'hypernate' })
export class HypernatePipe implements PipeTransform {
  transform(value: string): string {
    return function_.hypernate(value);
  }
}
