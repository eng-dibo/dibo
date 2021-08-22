/*
 - notes for he consumer:
   - install peerDependencies
   - this module and it's components don't perform any HTTP request,
     it just receives the data and show it.
   - @angular/material: add material css to angular.json styles[]
   - ngx-sharebuttons/buttons: add `HttpClientModule` to `@ngModule.imports`
   - we use `ngx-quill`  for <quill-view>
*/

import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxContentViewComponent } from './view';
import { NgxContentArticleComponent } from './article';
// to use pipes
import { NgxContentCoreModule } from '@engineers/ngx-content-core';

import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';

import { LazyLoadImageModule } from 'ng-lazyload-image';
import { HighlightModule } from 'ngx-highlightjs';
import { QuillModule } from 'ngx-quill';
import { ShareButtonsModule } from 'ngx-sharebuttons/buttons';
import {
  FontAwesomeModule,
  FaIconLibrary,
} from '@fortawesome/angular-fontawesome';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { NgxLoadingModule } from 'ngx-loading';
import { ScrollingModule } from '@angular/cdk/scrolling';

@NgModule({
  declarations: [NgxContentViewComponent, NgxContentArticleComponent],
  exports: [NgxContentViewComponent, NgxContentArticleComponent],
  imports: [
    CommonModule,
    MatCardModule,
    MatGridListModule,
    MatIconModule,
    MatListModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatChipsModule,
    MatBadgeModule,
    MatButtonModule,
    LazyLoadImageModule,
    HighlightModule,
    QuillModule.forRoot(),
    ShareButtonsModule,
    FontAwesomeModule,
    HttpClientModule,
    NgxContentCoreModule,
    NgxLoadingModule.forRoot({
      primaryColour: 'red',
      secondaryColour: 'blue',
      tertiaryColour: 'green',
    }),
    ScrollingModule,
  ],
  providers: [],
  bootstrap: [],
})
export class NgxContentViewModule {
  constructor(faIconLibrary: FaIconLibrary) {
    faIconLibrary.addIconPacks(fab, fas);
  }
}
