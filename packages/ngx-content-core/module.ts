import { NgModule } from '@angular/core';
import {
  SlugPipe,
  Nl2brPipe,
  KeepHtmlPipe,
  LengthPipe,
  Html2textPipe,
  HypernatePipe,
} from './pipes';

// we export Pipes, so other modules that imports this module can use them.
@NgModule({
  declarations: [
    SlugPipe,
    Nl2brPipe,
    KeepHtmlPipe,
    LengthPipe,
    Html2textPipe,
    HypernatePipe,
  ],
  imports: [],
  exports: [
    SlugPipe,
    Nl2brPipe,
    KeepHtmlPipe,
    LengthPipe,
    Html2textPipe,
    HypernatePipe,
  ],
})
export class NgxContentCoreModule {}
