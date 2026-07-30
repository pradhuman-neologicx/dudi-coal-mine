import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { JwtService } from './jwt.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  constructor(
    private apiService: ApiService,
    private jwtService: JwtService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.jwtService.getToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getProducts(page?: number, limit?: number | string, search?: string): Observable<any> {
    let params = new HttpParams();
    if (page) params = params.set('page', page.toString());
    if (limit && limit !== 'all') params = params.set('limit', limit.toString());
    if (search) params = params.set('search', search);

    return this.apiService.get('v1/admin/products', this.getHeaders(), params);
  }

  getAllProducts(): Observable<any> {
    return this.apiService.get('v1/products', this.getHeaders());
  }

  getAvailableProducts(): Observable<any> {
    return this.apiService.get('v1/available-products', this.getHeaders());
  }

  getProductById(id: string | number): Observable<any> {
    return this.apiService.get(`v1/admin/products/${id}`, this.getHeaders());
  }

  createProduct(formData: FormData): Observable<any> {
    return this.apiService.post('v1/admin/products', formData, this.getHeaders());
  }

  updateProduct(id: string | number, formData: FormData): Observable<any> {
    return this.apiService.post(`v1/admin/products/${id}`, formData, this.getHeaders());
  }

  updateProductStatus(id: string | number, status: number): Observable<any> {
    return this.apiService.patch(`v1/admin/products/${id}/status`, { status }, this.getHeaders());
  }
}
