import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormlyQuillComponent } from './formly-quill.component';

describe('FormlyQuillComponent', () => {
  let component: FormlyQuillComponent;
  let fixture: ComponentFixture<FormlyQuillComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FormlyQuillComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FormlyQuillComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
