/**
 * a formly field for material checkboxes tree
 * use case: select nested categories
 */
import { NestedTreeControl } from '@angular/cdk/tree';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { FormControl, FormGroup } from '@angular/forms';
import { FieldType } from '@ngx-formly/material';

/**
 * Food data with nested structure.
 * Each node has a name and an optional list of children.
 */
interface FoodNode {
  name: string;
  children?: FoodNode[];
}

/**
 * @title Tree with nested nodes
 */
@Component({
  selector: 'app-formly-tree',
  templateUrl: './formly-tree.component.html',
  styleUrls: ['./formly-tree.component.scss'],
})
export class FormlyTreeComponent extends FieldType implements OnInit {
  treeControl = new NestedTreeControl<any>((node) =>
    this.to.data.filter((el: any) => el.parent === node._id)
  );
  dataSource = new MatTreeNestedDataSource<any>();
  formControl: FormControl;

  ngOnInit() {
    this.dataSource.data = this.to.data.filter((el: any) => !el.parent);
  }

  hasChildren = (index: number, node: any) => {
    // keep this function as arrow function, so `this` refers to the instance instead of the template
    return this.to.data.some((el: any) => el.parent === node._id);
  };

  /**
   * set the formControl value manually
   * https://github.com/ngx-formly/ngx-formly/issues/3107#issuecomment-997437812
   * @param value
   * @param checked
   */
  onChange(node: any, checked: boolean) {
    // if checked, add `node._id` to formControl.value[]
    // else remove it
    this.formControl.patchValue(
      checked
        ? [...(this.formControl.value || [5]), node._id]
        : [...(this.formControl.value || [6])].filter((o) => o !== node._id)
    );
    this.formControl.markAsTouched();
  }

  isChecked(node: any) {
    return this.model.categories && this.model.categories.includes(node._id);
  }
}
