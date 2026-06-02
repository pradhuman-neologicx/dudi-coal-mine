import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { JwtService } from './jwt.service';

@Injectable({
  providedIn: 'root',
})
export class SalaryStructureService {
  constructor(
    private http: HttpClient,
    private apiservice: ApiService,
    private jwtService: JwtService
  ) {}

  createSalaryStructure(requestbody: any): Observable<any> {
    const token = this.jwtService.getToken();
    let headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    if (!(requestbody instanceof FormData)) {
      headers = headers.set('Content-Type', 'application/json');
    }
    return this.apiservice.post(`v1/admin/salarystructure`, requestbody, headers);
  }

  updateSalaryStructure(id: any, requestbody: any): Observable<any> {
    const token = this.jwtService.getToken();
    let headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    if (!(requestbody instanceof FormData)) {
      headers = headers.set('Content-Type', 'application/json');
    }
    return this.apiservice.post(`v1/admin/salarystructure/${id}`, requestbody, headers);
  }
}
