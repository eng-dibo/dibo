import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormlyFileComponent } from './formly-file.component';

describe('FormlyFileComponent', () => {
  let component: FormlyFileComponent;
  let fixture: ComponentFixture<FormlyFileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FormlyFileComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FormlyFileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
