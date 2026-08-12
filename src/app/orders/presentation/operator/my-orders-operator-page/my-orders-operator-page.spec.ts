import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyOrdersOperatorPage } from './my-orders-operator-page';

describe('MyOrdersOperatorPage', () => {
  let component: MyOrdersOperatorPage;
  let fixture: ComponentFixture<MyOrdersOperatorPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyOrdersOperatorPage],
    }).compileComponents();

    fixture = TestBed.createComponent(MyOrdersOperatorPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
