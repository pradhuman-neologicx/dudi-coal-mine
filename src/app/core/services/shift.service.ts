import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { JwtService } from './jwt.service';

@Injectable({
  providedIn: 'root',
})
export class ShiftService {
  constructor(
    private apiservice: ApiService,
    private jwtService: JwtService
  ) { }

  private getHeaders(): HttpHeaders {
    const token = this.jwtService.getToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  createShift(requestbody: any): Observable<any> {
    return this.apiservice.post(`v1/admin/shift`, requestbody, this.getHeaders());
  }

  getShifts(tableSize: any, page: any, search: any): Observable<any> {
    let params = new HttpParams();
    
    if (tableSize !== 'all') {
      params = params.set('limit', String(tableSize)).set('page', String(page));
    }

    if (search && search.trim().length > 0) {
      params = params.set('search', search.trim());
    }

    return this.apiservice.get(`v1/admin/shift`, this.getHeaders(), params).pipe(
      map((response: any) => {
        if (response.status === 200 && response.data) {
          response.data = response.data.map((item: any) => ({
            ...item,
            shiftName: item.name,
            startTime: item.start_time,
            endTime: item.end_time,
            minWorkingHours: item.minimum_working_hours,
            is_night_shift: item.is_night_shift !== undefined ? item.is_night_shift : 0,
            is_active: item.status !== undefined ? item.status : item.is_active
          }));
        }
        return response;
      })
    );
  }

  getAllShifts(): Observable<any> {
    return this.apiservice.get(`v1/shifts`, this.getHeaders());
  }

  getShiftRotation(fromDate: string, toDate: string, shiftId?: string | number): Observable<any> {
    let params = new HttpParams()
      .set('from_date', fromDate)
      .set('to_date', toDate);

    if (shiftId) {
      params = params.set('shift_id', String(shiftId));
    }
    return this.apiservice.get(`v1/admin/shift-rotation`, this.getHeaders(), params);
  }

  getShiftById(id: any): Observable<any> {
    return this.apiservice.get(`v1/admin/shift/${id}`, this.getHeaders()).pipe(
      map((response: any) => {
        if (response.status === 200 && response.data) {
          response.data = {
            ...response.data,
            shiftName: response.data.name,
            startTime: response.data.start_time,
            endTime: response.data.end_time,
            minWorkingHours: response.data.minimum_working_hours,
            is_active: response.data.status !== undefined ? response.data.status : response.data.is_active
          };
        }
        return response;
      })
    );
  }

  getMonthlyRosterDetails(employeeId: string, monthStr: string): Observable<any> {
    let params = new HttpParams();
    if (monthStr) {
      params = params.set('month', monthStr);
    }
    return this.apiservice.get(`v1/admin/shift-rotation/${employeeId}`, this.getHeaders(), params);
  }

  updateShift(id: any, body: any): Observable<any> {
    return this.apiservice.post(`v1/admin/shift/${id}`, body, this.getHeaders());
  }

  updateShiftStatus(id: any, body: any): Observable<any> {
    return this.apiservice.post(`v1/admin/shift/${id}/status`, body, this.getHeaders());
  }

  assignBulkShift(payload: { employee_ids: string[], shift_code: string }): Observable<any> {
    const formData = new FormData();
    payload.employee_ids.forEach((id: any) => {
      formData.append('employee_ids[]', String(id));
    });
    formData.append('shift_id', String(payload.shift_code));

    return this.apiservice.post('v1/admin/employee-shift-assignments', formData, this.getHeaders());
  }

  rotateShiftBulk(payload: { employee_ids: string[], target_shift_id: string, override?: boolean }): Observable<any> {
    const formData = new FormData();
    payload.employee_ids.forEach((id: any) => {
      formData.append('employee_ids[]', String(id));
    });
    formData.append('target_shift_id', String(payload.target_shift_id));
    if (payload.override) {
      formData.append('override', '1');
    }

    return this.apiservice.post('v1/admin/shift-rotation', formData, this.getHeaders());
  }

  bulkUploadShiftAssignments(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    return this.apiservice.post('v1/admin/employee-shift-assignments/bulk-upload', formData, this.getHeaders());
  }

  getShiftGroups(): Observable<any> {
    return this.apiservice.get('v1/employees', this.getHeaders()).pipe(
      map((res: any) => {
        const empData = res.data?.data || res.data || [];
        if (res.status === 200 && empData) {
          const groups: { [shiftCode: string]: string[] } = {
            "Shift A": [],
            "Shift B": [],
            "Shift C": []
          };

          empData.forEach((emp: any) => {
            const shiftName = emp.shift || '';
            if (shiftName) {
              if (!groups[shiftName]) {
                groups[shiftName] = [];
              }
              groups[shiftName].push(String(emp.id));
            }
          });

          return { status: 200, data: groups };
        }
        return res;
      })
    );
  }

  rotateBulkGroup(payload: { source_group: string, target_shift: string }): Observable<any> {
    const { source_group, target_shift } = payload;

    // 1. Fetch shifts to find the target shift ID
    return this.getShifts('all', 1, '').pipe(
      switchMap((shiftsRes: any) => {
        const shifts = shiftsRes.data || [];
        const targetShiftObj = shifts.find((s: any) => 
          s.name.toLowerCase() === target_shift.toLowerCase() || 
          String(s.id) === String(target_shift)
        );
        if (!targetShiftObj) {
          return throwError(() => new Error(`Target shift "${target_shift}" not found.`));
        }
        const targetShiftId = targetShiftObj.id;

        // 2. Fetch employees to find who is currently on the source_group shift
        return this.apiservice.get('v1/admin/employees', this.getHeaders()).pipe(
          switchMap((employeesRes: any) => {
            const employees = employeesRes.data || [];
            const empIds = employees
              .filter((emp: any) => emp.shift && emp.shift.toLowerCase() === source_group.toLowerCase())
              .map((emp: any) => String(emp.id));

            if (empIds.length === 0) {
              return of({ status: 400, message: `No employees currently have "${source_group}" assigned.` });
            }

            // 3. Perform bulk shift assignment to target shift ID
            return this.assignBulkShift({ employee_ids: empIds, shift_code: String(targetShiftId) });
          })
        );
      })
    );
  }

  private getDateRange(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    const start = this.parseDate(startDate);
    const end = this.parseDate(endDate);

    if (!start || !end || start > end) {
      return dates;
    }

    const current = new Date(start);
    while (current <= end) {
      dates.push(this.formatDate(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }

  private parseDate(dateStr: string): Date | null {
    const parts = dateStr.split('-').map(Number);
    if (parts.length !== 3 || parts.some(part => Number.isNaN(part))) {
      return null;
    }
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
