import {
  Component,
  Input,
  OnInit,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { FieldType } from '@ngx-formly/material';
import { LoadComponentsService } from '@engineers/ngx-utils/load-components.service';
import { DomSanitizer } from '@angular/platform-browser';
import { Categories } from './functions';
import { FormControl } from '@angular/forms';

// todo: use template:Categories.createInputs() instead of type=FormlyFieldCategories
@Component({
  selector: 'formly-field-categories',
  template: ` <ng-template #ref> </ng-template> `,
})
export class FormlyFieldCategories extends FieldType implements OnInit {
  categories: any;
  @ViewChild('ref', { read: ViewContainerRef, static: true })
  ref!: ViewContainerRef;
  formControl: FormControl;

  constructor(private load: LoadComponentsService) {
    super();
  }

  ngOnInit(): void {
    // this.createComponent();
    // todo: load <mat-checkbox> inputs directly without a helper class
    this.load.load(FormlyFieldCategoriesHelper, this.ref, {
      data: this.to.categories,
      to: this.to,
      formControl: this.formControl,
      field: this.field,
    });
  }
}

/*
  notes:
   - didn't work:
       <ng-template *ngFor="let ctg of dataObj"
         ><mat-checkbox>{{ ctg.title }}</mat-checkbox>
       </ng-template>
  - ngAfterViewChecked: runs multiple times
  - ngAfterViewInit, needs `setTimeout` so the code may be run before the DOM has been completely created and checked.
  todo:
   - add checked inputs to form value
   - use ref.nativeElement instead of document.* https://stackoverflow.com/a/55774120
   */
@Component({
  selector: 'formly-field-categories-helper',
  template: `
    <div [innerHTML]="categories"></div>
    <div *ngIf="!categories">Loading....</div>
  `,
})
/*implements OnInit, AfterViewInit, AfterViewChecked*/
export class FormlyFieldCategoriesHelper implements OnInit {
  @Input() data!: any[];
  @Input() to: any; // templateOptions
  // https://github.com/aitboudad/ngx-formly/blob/28bf56ab63ad158a7418ea6d7f2377165252a3e3/src/material/checkbox/src/checkbox.type.ts
  @Input() formControl: any;
  @Input() field: any;
  categories: any;
  constructor(private sanitizer: DomSanitizer) {}
  ngOnInit(): void {
    console.log('FormlyFieldCategoriesHelper', {
      categories: this.data,
      to: this.to,
      formControl: this.formControl,
      field: this.field,
    });

    let ctg = new Categories(this.data);
    let inputs =
      ctg.createInputs(
        null,
        (element) => element._id !== '5ac348980d63be4aa0e967cb'
      ) +
      `<mat-checkbox [formControl]="formControl" [formlyAttributes]="field">test</mat-checkbox>` +
      `<input type="checkbox" name="categories" value="5ac348980d63be4aa0e96846" [formcontrol]="formControl" [formlyattributes]="field"> test2`;
    this.categories = this.sanitizer.bypassSecurityTrustHtml(inputs);
    // using "keepHtml" pipe makes all checkboxes disabled.
  }

  /*  //https://stackoverflow.com/a/58906176
    ngAfterViewInit() {
      console.log(
        "ngAfterViewInit",
        document.querySelectorAll('[name="groups"]').length
      );
      setTimeout(() => {
        console.log(
          "ngAfterViewInit",
          document.querySelectorAll('[name="groups"]').length
        );
        document.querySelectorAll('[name="groups"]').forEach(el =>
          el.addEventListener("change", () => {
            //  alert("change" + el);
            console.log("changed");
            this.onChange(el);
          })
        );
      }, 5000);
    }
    ngAfterViewChecked() {
      console.log(
        "ngAfterViewChecked",
        document.querySelectorAll('[name="groups"]').length
      );
    } */

  onChange(element: any): void {
    // todo: add el to formControl
    console.log('onChange', element);
  }
}
