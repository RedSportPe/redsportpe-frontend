import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { CommercialAgent } from '../domain/commercial-agent.model';

const API_URL = 'http://localhost:8080/api';

/** Shape of the backend's StoreResource */
interface StoreResponse {
  id: string;
  name: string;
  code: string;
  boletaSeries: string;
  address: string;
  managerName: string;
  district: string;
  province: string;
  department: string;
  phone: string;
  active: boolean;
}

/** Talks to /api/stores. Maps backend StoreResource ↔ frontend CommercialAgent. */
@Injectable({ providedIn: 'root' })
export class AgentsRepository {
  private http = inject(HttpClient);

  /** GET /api/stores → active stores */
  getAll(): Observable<CommercialAgent[]> {
    return this.http
      .get<StoreResponse[]>(`${API_URL}/stores`)
      .pipe(map(list => list.map(this.toAgent)));
  }

  /** POST /api/stores → creates store + operator + link in one shot */
  create(data: {
    name: string;
    address: string;
    managerName: string;
    district: string;
    province: string;
    department: string;
    phone: string;
    operatorEmail: string;
    operatorPassword: string;
  }): Observable<CommercialAgent> {
    return this.http
      .post<StoreResponse>(`${API_URL}/stores`, data)
      .pipe(map(this.toAgent));
  }

  /** PATCH /api/stores/{id}/operator → change the cashier credential */
  updateOperator(
    storeId: string,
    changes: { name?: string; email?: string; password?: string }
  ): Observable<CommercialAgent> {
    return this.http
      .patch<StoreResponse>(`${API_URL}/stores/${storeId}/operator`, changes)
      .pipe(map(this.toAgent));
  }

  /** DELETE /api/stores/{id} → soft delete */
  remove(storeId: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/stores/${storeId}`);
  }

  private toAgent(r: StoreResponse): CommercialAgent {
    return {
      id: r.id,
      storeCode: r.code,
      name: r.name,
      managerName: r.managerName ?? '',
      address: r.address ?? '',
      district: r.district ?? '',
      province: r.province ?? '',
      department: r.department ?? '',
      phone: r.phone || undefined,
      boletaSerie: r.boletaSeries,
      operatorEmail: undefined, // backend doesn't expose operator email in StoreResource yet
    };
  }
}
