/**
 * @jest-environment jsdom
 */

import { beforeAll, beforeEach, expect, test } from '@jest/globals';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  Component,
  ComponentRef,
  NgModule,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { LoadComponentsService } from './load-components.service';

let dynamicComponent: ComponentRef<DynamicComponent>;
let hostComponent: HostComponent;
let fixture: ComponentFixture<HostComponent>;
let service: LoadComponentsService;

// the component to be loaded dynamically and injected to HostComponent
@Component({
  selector: 'dynamic-comp',
  template: `<div>component loaded dynamically {{ x }}</div>`,
})
class DynamicComponent {
  x: string;
  constructor() {}
}

@Component({
  selector: 'host-comp',
  template: `<ng-template #placeholder>component placeholder</ng-template>`,
})
class HostComponent {
  @ViewChild('placeholder', { static: true }) placeholder!: ViewContainerRef;
  constructor(private reference: ViewContainerRef) {}
  ngOnInit(): void {
    // this.placeholder gives error in ./load-components.service.ts: placeholder.clear
    dynamicComponent = service.load(
      DynamicComponent,
      this.ref /*or this.placeholder*/,
      { x: 'xx' }
    );
  }
}

// entryComponents doesn't exist in TestBed.configureTestingModule
// use TestBed.overrideModule() https://stackoverflow.com/a/45550720/12577650
// or use @NgModule https://stackoverflow.com/a/41484578/12577650
@NgModule({
  declarations: [HostComponent, DynamicComponent],
  entryComponents: [DynamicComponent],
  // bootstrap: [HostComponent],
})
class TestModule {}

beforeAll(() => {
  TestBed.configureTestingModule({
    declarations: [DynamicComponent, HostComponent],
    providers: [LoadComponentsService],
    imports: [TestModule],
  }).compileComponents();

  service = TestBed.inject(LoadComponentsService);
});

beforeEach(() => {
  fixture = TestBed.createComponent(HostComponent);
  hostComponent = fixture.componentInstance;
  fixture.detectChanges();
});

test('hostComponent should be created', () => {
  expect(hostComponent).toBeTruthy();
  expect(hostComponent).toBeInstanceOf(HostComponent);
});

test('dynamicComponent should be loaded in HostComponent', () => {
  expect(dynamicComponent).toBeTruthy();
  expect(dynamicComponent).toBeInstanceOf(ComponentRef);
  expect(dynamicComponent.location.nativeElement.innerHTML).toEqual(
    '<div>component loaded dynamically xx</div>'
  );
});

test('provide data to dynamicComponent', () => {
  expect(dynamicComponent.instance.x).toEqual('xx');
});
