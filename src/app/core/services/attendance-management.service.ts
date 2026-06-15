import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ApiService } from "./api.service";
import { JwtService } from "./jwt.service";
import { BehaviorSubject, Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class AttendanceManagementService {
  private approvalStageMessage = new BehaviorSubject("");
  currentApprovalStageMessage = this.approvalStageMessage.asObservable();
  sessionId!: string;

  constructor(
    private http: HttpClient,
    private apiservice: ApiService,
    private jwtService: JwtService
  ) { }

  private getHeaders(): HttpHeaders {
    const token = this.jwtService.getToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  Getbatchassign(body:any){
    const headers = { 'content-type': 'application/json' };
    return this.apiservice.post("student-attendance/assigned-batches", body, headers);
  }

  GetDailyAttendanceBatchApi(body:any, batchId:any, tableSize:any, page:any, searchText:any){
    const headers = { 'content-type': 'application/json' };
    let params = new HttpParams().set('limit', String(tableSize)).set('page', String(page));
    
    if (batchId && batchId !== 'all') {
      params = params.set('batchId', String(batchId));
    }
    if (searchText && searchText.trim().length > 0) {
      params = params.set('search', searchText.trim());
    }
    
    return this.apiservice.post(`student-attendance/get-students?${params.toString()}`, body, headers);
  }

  Getstudentattendancepagination(tableSize:any, page:any, body:any, searchText:any, batchId:any) {
    const headers = { 'content-type': 'application/json' };
    let params = new HttpParams().set('limit', String(tableSize)).set('page', String(page));
    
    if (searchText && searchText.trim().length > 0) {
      params = params.set('search', searchText.trim());
    }
    if (batchId && batchId !== 'all') {
      params = params.set('batchId', String(batchId));
    }
    
    return this.apiservice.post(`student-attendance/get-students?${params.toString()}`, body, headers);
  }

  GetstudentattendanceSearch(tableSize:any, page:any, searchText:any, body:any, batchId:any)  {
    const headers = { 'content-type': 'application/json' };
    let params = new HttpParams().set('limit', String(tableSize)).set('page', String(page));
    
    if (searchText && searchText.trim().length > 0) {
      params = params.set('search', searchText.trim());
    }
    if (batchId && batchId !== 'all') {
      params = params.set('batchId', String(batchId));
    }

    return this.apiservice.post(`student-attendance/get-students?${params.toString()}`, body, headers);
  }

  MarkAttedanceApi(body: any) {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this.apiservice.post('student-attendance/mark-attendance', body, headers);
  }

  MarkAttendanceExcelApi(formData:any){
    return this.apiservice.postWithoutHeader("student-attendance/upload-attendance-file", formData);
  }

  GetDailyAttendanceroleemployeeApi(body:any, role_id:any){
    let url = "student-attendance/get-employees";
    if (role_id && role_id !== 'all') {
      url += `?roleId=${role_id}`;
    }
    return this.apiservice.postWithoutHeader(url, body);
  }

  GetMonthlyAttendacneRoleId(body:any, role_id:any){
    return this.apiservice.postWithoutHeader(`student-attendance/get-students-monthly-attendance?roleId=${role_id}`, body);
  }

  GetMonthlyAttendanceBatchApi(body:any, batchId:any, tableSize:any, page:any, searchText:any){
    const headers = { 'content-type': 'application/json' };
    let params = new HttpParams().set('limit', String(tableSize)).set('page', String(page));
    
    if (batchId && batchId !== 'all') {
      params = params.set('batchId', String(batchId));
    }
    if (searchText && searchText.trim().length > 0) {
      params = params.set('search', searchText.trim());
    }
    
    return this.apiservice.post(`student-attendance/get-students-monthly-attendance?${params.toString()}`, body, headers);
  }

  Getstudentattendancemonthlypagination(tableSize:any, page:any, body:any, searchText:any, batchId:any) {
    const headers = { 'content-type': 'application/json' };
    let params = new HttpParams().set('limit', String(tableSize)).set('page', String(page));
    
    if (searchText && searchText.trim().length > 0) {
      params = params.set('search', searchText.trim());
    }
    if (batchId && batchId !== 'all') {
      params = params.set('batchId', String(batchId));
    }
    
    return this.apiservice.post(`student-attendance/get-students-monthly-attendance?${params.toString()}`, body, headers);
  }

  GetstudentattendancemonthlySearch(tableSize:any, page:any, searchText:any, body:any, batchId:any)  {
    const headers = { 'content-type': 'application/json' };
    let params = new HttpParams().set('limit', String(tableSize)).set('page', String(page));
    
    if (searchText && searchText.trim().length > 0) {
      params = params.set('search', searchText.trim());
    }
    if (batchId && batchId !== 'all') {
      params = params.set('batchId', String(batchId));
    }
    
    return this.apiservice.post(`student-attendance/get-students-monthly-attendance?${params.toString()}`, body, headers);
  }

  MarkAttedanceEmployeeApi(body: any) {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this.apiservice.post('student-attendance/mark-employeeAttendance', body, headers);
  }

  GetDailyAttendanceEmployeeApi(body:any){
    const headers = { 'content-type': 'application/json' };
    return this.apiservice.post("student-attendance/get-employees", body, headers);
  }

  GetRoles(){
    const headers = this.getHeaders().set('Content-Type', 'application/json');
    return this.apiservice.get("auth/getUserManagementRoles", headers);
  }
  
  MarkAttendanceemployeeExcelApi(formData:any){
    return this.apiservice.postWithoutHeader("student-attendance/mark-employeeAttendance-file", formData);
  }

  GetemployeemonthlyAttendanceApi(body:any){
    const headers = { 'content-type': 'application/json' };
    return this.apiservice.post("student-attendance/get-employees-monthly-attendance", body, headers);
  }

  GetemployeeAttendancemonthlywiseApi(body:any){
    const headers = { 'content-type': 'application/json' };
    return this.apiservice.post("student-attendance/get-employee-attendance-mont-wise", body, headers);
  }

  GetstudentmonthlyAttendanceApi(body:any){
    const headers = { 'content-type': 'application/json' };
    return this.apiservice.post("student-attendance/get-students-monthly-attendance", body, headers);
  }

  GetStudentAttendancemonthlywiseApi(body:any){
    const headers = { 'content-type': 'application/json' };
    return this.apiservice.post("student-attendance/get-students-attendance-mont-wise", body, headers);
  }

  GetMonthlyAttendanceroleemployeeApi(body:any, role_id:any){
    let url = "student-attendance/get-employees-monthly-attendance";
    if (role_id && role_id !== 'all') {
      url += `?roleId=${role_id}`;
    }
    return this.apiservice.postWithoutHeader(url, body);
  }

  getAttendance(limit: any, page: any, search: string, fromDate: string, toDate: string, status: string, viewType?: string, month?: string, year?: string): Observable<any> {
    const headers = this.getHeaders().set('Content-Type', 'application/json');
    let params = new HttpParams().set('limit', String(limit)).set('page', String(page));

    if (search && search.trim().length > 0) {
      params = params.set('search', search.trim());
    }
    if (fromDate) {
      params = params.set('from_date', fromDate);
    }
    if (toDate) {
      params = params.set('to_date', toDate);
    }
    if (status) {
      params = params.set('attendance_status', status.toLowerCase());
    }
    if (viewType) {
      params = params.set('view_type', viewType);
    }
    if (month) {
      params = params.set('month', month);
    }
    if (year) {
      params = params.set('year', year);
    }

    return this.apiservice.get(`v1/admin/attendance`, headers, params);
  }

  bulkUploadAttendance(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.apiservice.post('v1/admin/attendance/bulk-upload', formData, this.getHeaders());
  }

  getEmployeeAttendanceDetails(employeeId: string): Observable<any> {
    const headers = this.getHeaders().set('Content-Type', 'application/json');
    return this.apiservice.get(`v1/admin/attendance/employee/${employeeId}`, headers);
  }

  getAttendanceById(id: string): Observable<any> {
    return this.apiservice.get(`v1/admin/attendance/${id}`, this.getHeaders());
  }

  updateAttendance(formData: FormData): Observable<any> {
    return this.apiservice.post(`v1/admin/attendance/correction`, formData, this.getHeaders());
  }

  updateBulkAttendanceStatus(formData: FormData): Observable<any> {
    return this.apiservice.post(`v1/admin/attendance/bulk-status`, formData, this.getHeaders());
  }
}
