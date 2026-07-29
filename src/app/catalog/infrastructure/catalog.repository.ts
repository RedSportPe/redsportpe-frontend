import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Product } from '../domain/product.model';

@Injectable({ providedIn: 'root' })
export class CatalogRepository {
  private http = inject(HttpClient);

  /** Today: static JSON. Tomorrow: GET /api/products */
  getPublishedProducts(): Observable<Product[]> {
    return this.http.get<Product[]>('/data/products.json');
  }

  /** Today: fetches the JSON and finds by id.
   *  Tomorrow: GET /api/products/:id (the backend does the finding) */
  getProductById(id: string): Observable<Product | undefined> {
    return this.getPublishedProducts().pipe(
      map(products => products.find(p => p.id === id))
    );
  }
}
