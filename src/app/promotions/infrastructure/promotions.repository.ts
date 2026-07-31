import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Promotion } from '../domain/promotion.model';

@Injectable({ providedIn: 'root' })
export class PromotionsRepository {
  private http = inject(HttpClient);

  /** Today: static JSON. Tomorrow: GET /api/promotions */
  getPromotions(): Observable<Promotion[]> {
    return this.http.get<Promotion[]>('/data/promotions.json');
  }
}
