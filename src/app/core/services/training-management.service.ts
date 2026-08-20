import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { JwtService } from './jwt.service';

@Injectable({
  providedIn: 'root',
})
export class TrainingManagementService {
  constructor(
    private apiservice: ApiService,
    private jwtService: JwtService
  ) { }

  private getHeaders(): HttpHeaders {
    const token = this.jwtService.getToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getSupervisors(): Observable<any> {
    return this.apiservice.get(`v1/employees?role=supervisor`, this.getHeaders());
  }

  getEmployees(): Observable<any> {
    return this.apiservice.get(`v1/active-employees?role=driver,worker`, this.getHeaders());
  }

  getTrainingTypes(): Observable<any> {
    return this.apiservice.get(`v1/training-types`, this.getHeaders());
  }

  getTrainings(params: string = ''): Observable<any> {
    return this.apiservice.get(`v1/admin/trainings${params}`, this.getHeaders());
  }

  createTraining(payload: any): Observable<any> {
    return this.apiservice.post(`v1/admin/trainings`, payload, this.getHeaders());
  }

  getTrainingById(id: string): Observable<any> {
    return this.apiservice.get(`v1/admin/trainings/${id}`, this.getHeaders());
  }

  updateTraining(id: string, payload: any): Observable<any> {
    return this.apiservice.put(`v1/admin/trainings/${id}`, payload, this.getHeaders());
  }

  updateTrainingStatus(id: string, body: any): Observable<any> {
    return this.apiservice.patch(`v1/admin/trainings/${id}/status`, body, this.getHeaders());
  }
}
