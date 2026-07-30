import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { JwtService } from './jwt.service';

@Injectable({
  providedIn: 'root',
})
export class DelayService {
  constructor(
    private apiservice: ApiService,
    private jwtService: JwtService
  ) { }

  private getHeaders(): HttpHeaders {
    const token = this.jwtService.getToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getDelayLogs(paramsObj: any): Observable<any> {
    const headers = this.getHeaders();
    let params = new HttpParams();
    
    Object.keys(paramsObj).forEach(key => {
      if (paramsObj[key] !== null && paramsObj[key] !== undefined && paramsObj[key] !== '') {
        params = params.set(key, paramsObj[key].toString());
      }
    });

    return this.apiservice.get(`v1/admin/delays`, headers, params);
  }

  saveDelay(data: any): Observable<any> {
    return this.apiservice.post(`v1/admin/delays`, data, this.getHeaders());
  }

  getDelayById(id: string | number): Observable<any> {
    return this.apiservice.get(`v1/admin/delays/${id}`, this.getHeaders());
  }

  updateDelay(id: string | number, data: any): Observable<any> {
    return this.apiservice.post(`v1/admin/delays/${id}`, data, this.getHeaders());
  }

  importDelays(file: File): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('file', file, file.name);
    return this.apiservice.post(`v1/admin/delays/import`, formData, this.getHeaders());
  }
}
