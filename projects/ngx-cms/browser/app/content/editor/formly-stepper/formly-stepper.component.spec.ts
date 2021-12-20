import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormlyStepperComponent } from './formly-stepper.component';

describe('FormlyStepperComponent', () => {
  let component: FormlyStepperComponent;
  let fixture: ComponentFixture<FormlyStepperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FormlyStepperComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FormlyStepperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
