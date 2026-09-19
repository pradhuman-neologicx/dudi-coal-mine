import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { JwtService } from './jwt.service';

@Injectable({
  providedIn: 'root'
})
export class StoreService {

  constructor(
    private apiservice: ApiService,
    private jwtService: JwtService
  ) {}

  getStores(tableSize?: number, page?: number, search?: string): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    let params = new HttpParams();
    if (tableSize && tableSize !== 0) {
      params = params.set('limit', tableSize.toString());
    }
    if (page && page !== 0) {
      params = params.set('page', page.toString());
    }
    if (search && search.length > 0) {
      params = params.set('search', search);
    }

    return this.apiservice.get(`v1/admin/stores`, headers, params).pipe(
      map((response: any) => {
        if (response.status === 200 && response.data) {
          response.data = response.data.map((item: any) => ({
            ...item,
            is_active: item.status !== undefined ? item.status : item.is_active
          }));
        }
        return response;
      })
    );
  }

  getStoreById(id: any): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.apiservice.get(`v1/admin/stores/${id}`, headers).pipe(
      map((response: any) => {
        if (response.status === 200 && response.data) {
          response.data = {
            ...response.data,
            is_active: response.data.status !== undefined ? response.data.status : response.data.is_active
          };
        }
        return response;
      })
    );
  }

  getAllStores(): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.apiservice.get(`v1/stores`, headers);
  }

  getAvailableProductsByStore(storeId: any): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    let params = new HttpParams().set('store_id', storeId.toString());
    return this.apiservice.get(`v1/available-products`, headers, params);
  }

  createStore(body: any): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.apiservice.post(`v1/admin/stores`, body, headers);
  }

  updateStore(id: any, body: any): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.apiservice.put(`v1/admin/stores/${id}`, body, headers);
  }

  updateStoreStatus(id: any, body: any): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.apiservice.patch(`v1/admin/stores/${id}/status`, body, headers);
  }

  deleteStore(id: any): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.apiservice.deleteFun(`v1/admin/stores/${id}`, { headers });
  }
}
