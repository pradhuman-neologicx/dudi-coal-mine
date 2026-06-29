import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { JwtService } from './jwt.service';

export interface ShiftPlan {
  id: number;
  reference_no: string;
  planning_date: string;
  shift_id: number;
  shift_name: string;
  site_id: number;
  site_name: string;
  target_bcm: string;
  actual_bcm: string;
  supervisor_id: number;
  supervisor_name: string;
  supervisor_code: string;
  site_incharge_id: number;
  site_incharge_name: string;
  site_incharge_code: string;
  equipment_count: number;
  status: string;
  created_by: number;
  creator_name: string;
  published_by: number | null;
  publisher_name: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShiftPlanSummary {
  total_scheduled_shifts: number;
  active_personnel: number;
  target_bcm: string;
  actual_bcm: string;
  current_efficiency: number;
}

export interface ShiftPlanPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface ShiftPlanFilters {
  page?: number | string;
  limit?: number | string;
  search?: string;
  start_date?: string;
  end_date?: string;
  site_id?: string | number;
  shift_id?: string | number;
  supervisor_id?: string | number;
  status?: string;
  period?: string;
}

export interface ShiftPlanResponse {
  status: number;
  message: string;
  data: ShiftPlan[];
  summary: ShiftPlanSummary;
  pagination: ShiftPlanPagination;
}

@Injectable({
  providedIn: 'root',
})
export class ShiftPlanningService {
  constructor(
    private apiService: ApiService,
    private jwtService: JwtService
  ) { }

  private getHeaders(): HttpHeaders {
    const token = this.jwtService.getToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getShiftPlans(filters?: ShiftPlanFilters): Observable<ShiftPlanResponse> {
    let params = new HttpParams();

    if (filters) {
      if (filters.page) params = params.set('page', String(filters.page));
      if (filters.limit && filters.limit !== 'all') params = params.set('limit', String(filters.limit));
      if (filters.search && filters.search.trim().length > 0) params = params.set('search', filters.search.trim());

      if (filters.start_date) params = params.set('start_date', filters.start_date);
      if (filters.end_date) params = params.set('end_date', filters.end_date);
      if (filters.site_id) params = params.set('site_id', String(filters.site_id));
      if (filters.shift_id) params = params.set('shift_id', String(filters.shift_id));
      if (filters.supervisor_id) params = params.set('supervisor_id', String(filters.supervisor_id));
      if (filters.status) params = params.set('status', filters.status);
      if (filters.period) params = params.set('period', filters.period);
    }

    return this.apiService.get(`v1/admin/shift-plans`, this.getHeaders(), params);
  }



  getMachineCategories(): Observable<any> {
    return this.apiService.get('v1/machine-categories', this.getHeaders());
  }

  getMachineNames(categoryId: string | number): Observable<any> {
    return this.apiService.get(`v1/machine-names/${categoryId}`, this.getHeaders());
  }
  getShifts(): Observable<any> {
    return this.apiService.get('v1/shifts', this.getHeaders());
  }

  getSites(): Observable<any> {
    return this.apiService.get('v1/sites', this.getHeaders());
  }

  getEmployees(role?: string): Observable<any> {
    let params = new HttpParams();
    if (role) params = params.set('role', role);
    return this.apiService.get('v1/employees', this.getHeaders(), params);
  }

  getAvailableEmployees(shiftPlanId: string | number, shiftId: string | number): Observable<any> {
    let params = new HttpParams().set('shift_id', String(shiftId));
    return this.apiService.get(`v1/admin/shift-plans/${shiftPlanId}/workforce/available-employees`, this.getHeaders(), params);
  }

  createShiftPlan(formData: FormData): Observable<any> {
    return this.apiService.post('v1/admin/shift-plans', formData, this.getHeaders());
  }

  updateShiftPlan(id: string | number, formData: FormData): Observable<any> {
    formData.append('_method', 'PUT');
    return this.apiService.post(`v1/admin/shift-plans/${id}`, formData, this.getHeaders());
  }

  getShiftPlanById(id: string | number): Observable<any> {
    return this.apiService.get(`v1/admin/shift-plans/${id}`, this.getHeaders());
  }

  getAssignedEquipment(planId: string | number): Observable<any> {
    return this.apiService.get(`v1/admin/shift-plans/${planId}/equipment`, this.getHeaders());
  }

  getShiftPlanMachines(planId: string | number, date: string): Observable<any> {
    const params = new HttpParams().set('date', date);
    return this.apiService.get(`v1/shift-plans/${planId}/machines`, this.getHeaders(), params);
  }

  assignEquipment(planId: string | number, data: any): Observable<any> {
    return this.apiService.post(`v1/admin/shift-plans/${planId}/equipment`, data, this.getHeaders());
  }

  removeAssignedEquipment(planId: string | number, equipmentId: string | number): Observable<any> {
    return this.apiService.deleteFun(`v1/admin/shift-plans/${planId}/equipment/${equipmentId}`, { headers: this.getHeaders() });
  }

  loadWorkforceRelay(planId: string | number): Observable<any> {
    return this.apiService.post(`v1/admin/shift-plans/${planId}/workforce/load-relay`, {}, this.getHeaders());
  }

  assignBorrowEmployees(planId: string | number, data: any): Observable<any> {
    return this.apiService.post(`v1/admin/shift-plans/${planId}/workforce/borrow`, data, this.getHeaders());
  }

  removeWorkforceEmployee(planId: string | number, id: string | number): Observable<any> {
    return this.apiService.deleteFun(`v1/admin/shift-plans/${planId}/workforce/${id}`, { headers: this.getHeaders() });
  }

  publishShiftPlan(planId: string | number): Observable<any> {
    return this.apiService.post(`v1/admin/shift-plans/${planId}/publish`, {}, this.getHeaders());
  }

  shiftPlanFilterByDate(datetime: string): Observable<any> {
    const params = new HttpParams().set('datetime', datetime);
    return this.apiService.get(`v1/shifts/by-datetime`, this.getHeaders(), params);
  }
}
