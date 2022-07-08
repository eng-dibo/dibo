/**
 * a formly field for material checkboxes tree
 * use case: select nested categories
 */
import { NestedTreeControl } from '@angular/cdk/tree';
import { Component, OnInit } from '@angular/core';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { FormControl } from '@angular/forms';
import { FieldType } from '@ngx-formly/material';

/**
 * @title Tree with nested nodes
 */
@Component({
  selector: 'app-formly-tree',
  templateUrl: './formly-tree.component.html',
  styleUrls: ['./formly-tree.component.scss'],
})
export class FormlyTreeComponent extends FieldType implements OnInit {
  formControl: FormControl;
  dataSource = new MatTreeNestedDataSource<any>();
  treeControl: NestedTreeControl<any>;

  ngOnInit() {
    if (this.to.data) {
      this.treeControl = new NestedTreeControl<any>((node) =>
        this.to.data.filter((element: any) => element.parent === node._id)
      );

      this.dataSource.data = this.to.data.filter(
        (element: any) => !element.parent
      );
    }
  }

  hasChildren = (index: number, node: any) => {
    // keep this function as arrow function, so `this` refers to the instance instead of the template
    return this.to.data.some((element: any) => element.parent === node._id);
  };

  /**
   * set the formControl value manually
   * https://github.com/ngx-formly/ngx-formly/issues/3107#issuecomment-997437812
   *
   * @param value
   * @param node
   * @param checked
   */
  onChange(node: any, checked: boolean) {
    // if checked, add `node._id` to formControl.value[]
    // else remove it
    this.formControl.patchValue(
      checked
        ? [...(this.formControl.value || []), node._id]
        : [...(this.formControl.value || [])].filter((o) => o !== node._id)
    );
    this.formControl.markAsTouched();
    // todo: toggle all children
  }

  isChecked(node: any) {
    return this.model.categories && this.model.categories.includes(node._id);
  }
}
