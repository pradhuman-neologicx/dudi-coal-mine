import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { JwtService } from './jwt.service';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  constructor(
    private apiService: ApiService,
    private jwtService: JwtService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.jwtService.getToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  addInventory(formData: FormData): Observable<any> {
    return this.apiService.post('v1/admin/inventories/add', formData, this.getHeaders());
  }

  updateInventoryQuantity(id: string | number, formData: FormData): Observable<any> {
    return this.apiService.post(`v1/admin/inventories/update-quantity/${id}`, formData, this.getHeaders());
  }

  bulkUploadInventory(formData: FormData): Observable<any> {
    return this.apiService.post('v1/admin/inventories/bulk-upload', formData, this.getHeaders());
  }

  assignInventory(formData: FormData): Observable<any> {
    return this.apiService.post('v1/admin/inventories/assign', formData, this.getHeaders());
  }

  getInventoryDetails(id: any): Observable<any> {
    return this.apiService.get(`v1/admin/inventories/${id}`, this.getHeaders());
  }

  getInventories(tableSize: any, page: any, search?: string, filters?: any): Observable<any> {
    let params = new HttpParams();

    if (tableSize !== 'all') {
      params = params.set('limit', String(tableSize)).set('page', String(page));
    }

    if (search && search.trim().length > 0) {
      params = params.set('search', search.trim());
    }

    if (filters) {
      if (filters.store_id) params = params.set('store_id', String(filters.store_id));
      if (filters.product_id) params = params.set('product_id', String(filters.product_id));
      if (filters.category_id) params = params.set('category_id', String(filters.category_id));
      if (filters.sub_category_id) params = params.set('sub_category_id', String(filters.sub_category_id));
    }

    return this.apiService.get('v1/admin/inventories', this.getHeaders(), params);
  }

  getInventoryLogs(id: any): Observable<any> {
    return this.apiService.get(`v1/admin/inventories/${id}/logs`, this.getHeaders());
  }

  getInventoryProducts(storeId?: string | number): Observable<any> {
    if (storeId) {
      return this.apiService.get(`v1/stores/${storeId}/products`, this.getHeaders());
    }
    return this.apiService.get('v1/inventory-products', this.getHeaders());
  }

  getInventoryAlerts(): Observable<any> {
    return this.apiService.get('v1/admin/inventory-alerts', this.getHeaders());
  }

  markAlertAsRead(id: string | number): Observable<any> {
    return this.apiService.post(`v1/admin/inventory-alerts/${id}/read`, {}, this.getHeaders());
  }

  markAllAlertsAsRead(): Observable<any> {
    return this.apiService.post('v1/admin/inventory-alerts/read-all', {}, this.getHeaders());
  }

  getDashboardOutOfStock(page: number = 1, limit: number = 10): Observable<any> {
    let params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    return this.apiService.get('v1/dashboard/inventory/out-of-stock', this.getHeaders(), params);
  }

  getDashboardBelowMinLevel(page: number = 1, limit: number = 10): Observable<any> {
    let params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    return this.apiService.get('v1/dashboard/inventory/below-min-level', this.getHeaders(), params);
  }
}
