import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Product } from '../domain/product.model';

@Injectable({ providedIn: 'root' })
export class CatalogRepository {

  /** MOCK: replace with HttpClient once the backend exists */
  getPublishedProducts(): Observable<Product[]> {
    return of(MOCK_PRODUCTS).pipe(delay(300)); // simulates network latency
  }
}

const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'CJCN Jacket',
    description: 'Sports jacket with hood',
    category: 'Jackets',
    price: 129.90,
    imageUrl: 'https://placehold.co/400x400/b91c1c/fff?text=Jacket',
    published: true,
    variants: [
      { sku: 'RS-CJCN-H-S-NEG', gender: 'H', size: 'S', color: 'NEG', totalStock: 12 },
      { sku: 'RS-CJCN-H-M-NEG', gender: 'H', size: 'M', color: 'NEG', totalStock: 8 },
    ],
  },
  {
    id: '2',
    name: 'RS Dry-Fit T-Shirt',
    description: 'Quick-dry training t-shirt',
    category: 'T-Shirts',
    price: 49.90,
    imageUrl: 'https://placehold.co/400x400/171717/fff?text=T-Shirt',
    published: true,
    variants: [
      { sku: 'RS-PDRF-U-M-ROJ', gender: 'U', size: 'M', color: 'ROJ', totalStock: 25 },
    ],
  },
];
