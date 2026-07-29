import { Component, input, signal, computed } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Product } from '../../../domain/product.model';

@Component({
  selector: 'app-trends-carousel',
  imports: [CurrencyPipe],
  templateUrl: './trends-carousel.html',
  styleUrl: './trends-carousel.scss',
})
export class TrendsCarousel {
  products = input.required<Product[]>();

  private currentIndex = signal(0);

  /** Index helpers (wrap around the list) */
  private prevIndex = computed(() => {
    const len = this.products().length;
    return (this.currentIndex() - 1 + len) % len;
  });
  private nextIndex = computed(() => {
    const len = this.products().length;
    return (this.currentIndex() + 1) % len;
  });

  /** The three visible slides: [left, center, right] */
  readonly visibleSlides = computed(() => {
    const items = this.products();
    if (items.length < 3) return items.map((p, i) => ({ product: p, position: i === 0 ? 'center' : 'right' }));
    return [
      { product: items[this.prevIndex()], position: 'left' as const },
      { product: items[this.currentIndex()], position: 'center' as const },
      { product: items[this.nextIndex()], position: 'right' as const },
    ];
  });

  rotateNext(): void {
    this.currentIndex.set(this.nextIndex());
  }

  rotatePrev(): void {
    this.currentIndex.set(this.prevIndex());
  }

  /** Clicking a side card brings it to the center */
  onSlideClick(position: string | number | LineAndPositionSetting | undefined | null): void {
    if (position === 'left') this.rotatePrev();
    if (position === 'right') this.rotateNext();
    // center click: later this will navigate to product detail
  }
}
