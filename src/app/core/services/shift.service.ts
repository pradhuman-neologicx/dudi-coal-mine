import { HttpClient, HttpHeaders } from '@angular/common/http';
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
    private http: HttpClient,
    private apiservice: ApiService,
    private jwtService: JwtService
  ) { }

  createShift(requestbody: any): Observable<any> {
    const token = this.jwtService.getToken();
    let headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    if (!(requestbody instanceof FormData)) {
      headers = headers.set('Content-Type', 'application/json');
    }
    return this.apiservice.post(`v1/admin/shift`, requestbody, headers);
  }

  getShifts(tableSize: any, page: any, search: any): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    let url = '';
    if (tableSize !== 'all') {
      url = `v1/admin/shift?limit=${tableSize}&page=${page}`;
    } else {
      url = `v1/admin/shift`;
    }

    if (search && search.length > 0) {
      url += (url.includes('?') ? '&' : '?') + `search=${search}`;
    }

    return this.apiservice.get(url, headers);
  }

  getShiftById(id: any): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
    return this.apiservice.get(`v1/admin/shift/${id}`, headers);
  }

  updateShift(id: any, body: any): Observable<any> {
    const token = this.jwtService.getToken();
    let headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    if (!(body instanceof FormData)) {
      headers = headers.set('Content-Type', 'application/json');
    }
    return this.apiservice.post(`v1/admin/shift/${id}`, body, headers);
  }

  updateShiftStatus(id: any, body: any): Observable<any> {
    const token = this.jwtService.getToken();
    let headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    if (!(body instanceof FormData)) {
      headers = headers.set('Content-Type', 'application/json');
    }
    return this.apiservice.post(`v1/admin/shift/${id}/status`, body, headers);
  }

  assignBulkShift(payload: { employee_ids: string[], shift_code: string }): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    const formData = new FormData();
    payload.employee_ids.forEach((id: any) => {
      formData.append('employee_ids[]', String(id));
    });
    formData.append('shift_id', String(payload.shift_code));

    return this.apiservice.post('v1/admin/employee-shift-assignments', formData, headers);
  }

  bulkUploadShiftAssignments(file: File): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    const formData = new FormData();
    formData.append('file', file, file.name);

    return this.apiservice.post('v1/admin/employee-shift-assignments/bulk-upload', formData, headers);
  }

  getShiftGroups(): Observable<any> {
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    return this.apiservice.get('v1/admin/employees', headers).pipe(
      map((res: any) => {
        if (res.status === 200 && res.data) {
          const groups: { [shiftCode: string]: string[] } = {
            "Shift A": [],
            "Shift B": [],
            "Shift C": []
          };

          res.data.forEach((emp: any) => {
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
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

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
        return this.apiservice.get('v1/admin/employees', headers).pipe(
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
