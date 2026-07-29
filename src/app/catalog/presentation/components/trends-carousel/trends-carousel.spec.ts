import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrendsCarousel } from './trends-carousel';

describe('TrendsCarousel', () => {
  let component: TrendsCarousel;
  let fixture: ComponentFixture<TrendsCarousel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrendsCarousel],
    }).compileComponents();

    fixture = TestBed.createComponent(TrendsCarousel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
