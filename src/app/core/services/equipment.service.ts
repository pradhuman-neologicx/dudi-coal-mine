import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { JwtService } from './jwt.service';

@Injectable({
  providedIn: 'root',
})
export class EquipmentService {
  constructor(
    private apiService: ApiService,
    private jwtService: JwtService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.jwtService.getToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  // --- Equipment Categories (Equipment Master) ---
  getEquipments(limit: any, page: any, search?: string): Observable<any> {
    let params = new HttpParams();
    if (limit !== 'all') {
      params = params.set('limit', limit.toString());
      params = params.set('page', page.toString());
    }
    if (search && search.trim().length > 0) {
      params = params.set('search', search.trim());
    }
    return this.apiService.get('v1/admin/equipments', this.getHeaders(), params);
  }

  getEquipmentById(id: any): Observable<any> {
    return this.apiService.get(`v1/admin/equipments/${id}`, this.getHeaders());
  }

  createEquipment(body: any): Observable<any> {
    return this.apiService.post('v1/admin/equipments', body, this.getHeaders());
  }

  updateEquipment(id: any, body: any): Observable<any> {
    return this.apiService.post(`v1/admin/equipments/${id}`, body, this.getHeaders());
  }

  updateEquipmentStatus(id: any, body: any): Observable<any> {
    return this.apiService.post(`v1/admin/equipments/${id}/status`, body, this.getHeaders());
  }

  // --- Equipment Names (Equipments) ---
  getEquipmentNames(limit: any, page: any, search?: string, categoryId?: any): Observable<any> {
    let params = new HttpParams();
    if (limit !== 'all') {
      params = params.set('limit', limit.toString());
      params = params.set('page', page.toString());
    }
    if (search && search.trim().length > 0) {
      params = params.set('search', search.trim());
    }
    if (categoryId) {
      params = params.set('equipment_id', categoryId.toString());
    }
    return this.apiService.get('v1/admin/equipment-names', this.getHeaders(), params);
  }

  getEquipmentNameById(id: any): Observable<any> {
    return this.apiService.get(`v1/admin/equipment-names/${id}`, this.getHeaders());
  }

  createEquipmentName(body: any): Observable<any> {
    return this.apiService.post('v1/admin/equipment-names', body, this.getHeaders());
  }

  updateEquipmentName(id: any, body: any): Observable<any> {
    return this.apiService.post(`v1/admin/equipment-names/${id}`, body, this.getHeaders());
  }

  updateEquipmentNameStatus(id: any, body: any): Observable<any> {
    return this.apiService.post(`v1/admin/equipment-names/${id}/status`, body, this.getHeaders());
  }

  // --- Public Dropdown Lists ---
  getMachineCategories(): Observable<any> {
    return this.apiService.get('v1/machine-categories', this.getHeaders());
  }

  getMachineNames(categoryId: any): Observable<any> {
    return this.apiService.get(`v1/machine-names/${categoryId}`, this.getHeaders());
  }
}
