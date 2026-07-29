import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../domain/product.model';

@Injectable({ providedIn: 'root' })
export class CatalogRepository {
  private http = inject(HttpClient);

  /** Today: static JSON. Tomorrow: replace URL with the real API endpoint */
  getPublishedProducts(): Observable<Product[]> {
    return this.http.get<Product[]>('/data/products.json');
  }
}
