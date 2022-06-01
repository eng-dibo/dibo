/**
 * @jest-environment jsdom
 */

import { afterAll, beforeAll, expect, jest, test } from '@jest/globals';
import { TestBed } from '@angular/core/testing';
import { NgxLoadService } from './load-scripts.service';
import { Renderer2 } from '@angular/core';

let service: NgxLoadService;
let source =
  'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js';

beforeAll(() => {
  TestBed.configureTestingModule({
    providers: [NgxLoadService, Renderer2],
  });
  service = TestBed.inject(NgxLoadService);
});

test('service should be created', () => {
  expect(service).toBeTruthy();
});

// todo: run this test
test.skip('load() should return a fulfilled promise', () => {
  return expect(service.load(source)).resolves.not.toThrow();
});

// the previous test only checks that load() fulfilled,
// witch may be fails even if the script already loaded successfully
// this test may success even if the previous one failed
// don't do: service.load(src).then(()=>{ expect(...) })
test('head should contains the loaded script', () => {
  // run load() here again, because if the previous test skipped the script will not be loaded
  // and this test will fail
  service.load(source);
  expect(
    document.querySelectorAll('head')[0].innerHTML.indexOf('jquery.min.js')
  ).toBeGreaterThan(-1);
});
