import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OnlineOrdersPage } from './online-orders-page';

describe('OnlineOrdersPage', () => {
  let component: OnlineOrdersPage;
  let fixture: ComponentFixture<OnlineOrdersPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnlineOrdersPage],
    }).compileComponents();

    fixture = TestBed.createComponent(OnlineOrdersPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
