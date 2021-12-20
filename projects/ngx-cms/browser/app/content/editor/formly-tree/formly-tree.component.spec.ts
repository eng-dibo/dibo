import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormlyTreeComponent } from './formly-tree.component';

describe('FormlyTreeComponent', () => {
  let component: FormlyTreeComponent;
  let fixture: ComponentFixture<FormlyTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FormlyTreeComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FormlyTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
