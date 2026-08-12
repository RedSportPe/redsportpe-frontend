import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LabelPrintPage } from './label-print-page';

describe('LabelPrintPage', () => {
  let component: LabelPrintPage;
  let fixture: ComponentFixture<LabelPrintPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabelPrintPage],
    }).compileComponents();

    fixture = TestBed.createComponent(LabelPrintPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
