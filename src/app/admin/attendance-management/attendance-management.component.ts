import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MaterialModule } from 'src/app/mat/mat.module';
import * as XLSX from 'xlsx';
import { EmployeeService } from 'src/app/core/services/Employee.service';
import { NotificationService } from 'src/app/core/services/notificationnew.service';
import { NgxPaginationModule } from 'ngx-pagination';

interface RawBiometricLog {
  empId: string;
  date: string;
  checkIn: string;
  checkOut: string;
}

interface DailyAttendance {
  id: string;
  empId: string;
  empName: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  shift: string;
  status: 'Present' | 'Half Day' | 'Exception' | 'Absent' | 'Leave';
  site: string;
}

interface AttendanceCorrectionLog {
  id: string;
  empId: string;
  date: string;
  oldCheckIn: string | null;
  newCheckIn: string | null;
  oldCheckOut: string | null;
  newCheckOut: string | null;
  oldStatus: string;
  newStatus: string;
  reason: string;
  timestamp: Date;
}

@Component({
  selector: 'app-attendance-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MaterialModule, NgxPaginationModule],
  templateUrl: './attendance-management.component.html',
  styleUrl: './attendance-management.component.scss',
  providers: [DatePipe]
})
export class AttendanceManagementComponent implements OnInit {
  isDragging = false;
  uploadedLogs: RawBiometricLog[] = [];
  attendanceRecords: DailyAttendance[] = [];
  correctionLogs: AttendanceCorrectionLog[] = [];
  employees: any[] = [];

  uploadSummary = { total: 0, success: 0, errors: 0 };

  // Master list of records
  allAttendanceRecords: DailyAttendance[] = [];

  // Filter properties
  filterDate: string = '';
  filterStatus: string = '';
  filterSearch: string = '';
  filterSite: string = '';

  mockSites = ['East Mine', 'West Mine', 'North Sector'];

  // Freeze date (e.g., records before 3rd of current month are locked)
  freezeDate: Date = new Date(new Date().getFullYear(), new Date().getMonth(), 3);

  // Modal states
  showCorrectionModal = false;
  showBulkUploadModal = false;
  showManualEntryModal = false;
  correctionForm: FormGroup;
  manualEntryForm: FormGroup;
  selectedRecord: DailyAttendance | null = null;

  p: number = 1; // Pagination
  showEntries: number = 10;

  selectedRecordIds = new Set<string>();

  toggleSelection(recordId: string): void {
    if (this.selectedRecordIds.has(recordId)) {
      this.selectedRecordIds.delete(recordId);
    } else {
      this.selectedRecordIds.add(recordId);
    }
  }

  isRecordSelected(recordId: string): boolean {
    return this.selectedRecordIds.has(recordId);
  }

  toggleAllSelection(event: any): void {
    const checked = event.target.checked;
    if (checked) {
      this.attendanceRecords.forEach(r => this.selectedRecordIds.add(r.id));
    } else {
      this.attendanceRecords.forEach(r => this.selectedRecordIds.delete(r.id));
    }
  }

  isAllSelected(): boolean {
    if (this.attendanceRecords.length === 0) return false;
    return this.attendanceRecords.every(r => this.selectedRecordIds.has(r.id));
  }

  isSomeSelected(): boolean {
    if (this.attendanceRecords.length === 0) return false;
    const count = this.attendanceRecords.filter(r => this.selectedRecordIds.has(r.id)).length;
    return count > 0 && count < this.attendanceRecords.length;
  }

  clearSelection(): void {
    this.selectedRecordIds.clear();
  }

  markBulkAttendance(status: 'Present' | 'Absent' | 'Leave'): void {
    if (this.selectedRecordIds.size === 0) {
      this.notificationService.show('Please select at least one employee.', 'error', 3000);
      return;
    }

    let markedCount = 0;
    this.allAttendanceRecords.forEach(record => {
      if (this.selectedRecordIds.has(record.id)) {
        record.status = status;
        if (status === 'Present') {
          record.checkIn = '08:00';
          record.checkOut = '17:00';
        } else if (status === 'Absent' || status === 'Leave') {
          record.checkIn = '--:--';
          record.checkOut = '--:--';
        }
        markedCount++;
      }
    });

    localStorage.setItem('attendance_records', JSON.stringify(this.allAttendanceRecords));
    this.applyFilters();
    this.selectedRecordIds.clear();
    this.notificationService.show(`Successfully marked ${markedCount} employees as ${status}.`, 'success', 3000);
  }

  markIndividualAttendance(record: DailyAttendance, status: 'Present' | 'Absent' | 'Leave'): void {
    const index = this.allAttendanceRecords.findIndex(r => r.id === record.id);
    if (index >= 0) {
      this.allAttendanceRecords[index].status = status;
      if (status === 'Present') {
        this.allAttendanceRecords[index].checkIn = '08:00';
        this.allAttendanceRecords[index].checkOut = '17:00';
      } else if (status === 'Absent' || status === 'Leave') {
        this.allAttendanceRecords[index].checkIn = '--:--';
        this.allAttendanceRecords[index].checkOut = '--:--';
      }
      localStorage.setItem('attendance_records', JSON.stringify(this.allAttendanceRecords));
      this.applyFilters();
      this.notificationService.show(`Successfully marked ${record.empName} as ${status}.`, 'success', 3000);
    }
  }

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private notificationService: NotificationService,
    private datePipe: DatePipe
  ) {
    this.correctionForm = this.fb.group({
      checkIn: [''],
      checkOut: [''],
      status: ['', Validators.required],
      reason: ['', Validators.required],
      site: ['', Validators.required]
    });
    this.manualEntryForm = this.fb.group({
      empId: ['', Validators.required],
      date: ['', Validators.required],
      checkIn: [''],
      checkOut: [''],
      status: ['Present', Validators.required],
      reason: ['', Validators.required],
      site: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    const today = new Date();
    this.filterDate = this.datePipe.transform(today, 'yyyy-MM-dd') || '';
    this.loadEmployees();
  }

  loadEmployees() {
    this.employeeService.GetStaff('all', 1, '').subscribe({
      next: (res: any) => {
        if (res.status === 'success' || res.data) {
          this.employees = res.data || res;
          const stored = localStorage.getItem('attendance_records');
          if (stored) {
            this.allAttendanceRecords = JSON.parse(stored);
            this.applyFilters();
          } else {
            this.generateMockAttendance();
          }
        } else {
          // Mock data if API fails
          this.employees = [
            { id: 'EMP001', name: 'John Doe', shift: 'A' },
            { id: 'EMP002', name: 'Jane Smith', shift: 'B' },
            { id: 'EMP003', name: 'Robert Johnson', shift: 'C' }
          ];
          const stored = localStorage.getItem('attendance_records');
          if (stored) {
            this.allAttendanceRecords = JSON.parse(stored);
            this.applyFilters();
          } else {
            this.generateMockAttendance();
          }
        }
      },
      error: () => {
        // Mock data
        this.employees = [
          { id: 'EMP001', name: 'John Doe', shift: 'A' },
          { id: 'EMP002', name: 'Jane Smith', shift: 'B' },
          { id: 'EMP003', name: 'Robert Johnson', shift: 'C' }
        ];
        const stored = localStorage.getItem('attendance_records');
        if (stored) {
          this.allAttendanceRecords = JSON.parse(stored);
          this.applyFilters();
        } else {
          this.generateMockAttendance();
        }
      }
    });
  }

  generateMockAttendance() {
    this.allAttendanceRecords = [];
    const today = new Date();

    // Generate records for the past 7 days to give the filters meaningful data
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = this.datePipe.transform(d, 'yyyy-MM-dd') || '';

      this.employees.forEach(emp => {
        // Vary statuses randomly
        let status: 'Present' | 'Half Day' | 'Exception' | 'Absent' = 'Present';
        let checkIn = '08:00';
        let checkOut = '17:00';

        const rand = Math.random();
        if (rand < 0.15) {
          status = 'Absent';
          checkIn = '--:--';
          checkOut = '--:--';
        } else if (rand < 0.25) {
          status = 'Half Day';
          checkIn = '08:00';
          checkOut = '12:30';
        } else if (rand < 0.3) {
          status = 'Exception';
          checkIn = '08:15';
          checkOut = '--:--';
        }

        this.allAttendanceRecords.push({
          id: Math.floor(Math.random() * 100000).toString(),
          empId: emp.id || emp.user_id,
          empName: emp.name || (emp.first_name + ' ' + (emp.last_name || '')),
          date: dateStr,
          checkIn: checkIn,
          checkOut: checkOut,
          shift: emp.shift || 'A',
          status: status,
          site: emp.site || this.mockSites[Math.floor(Math.random() * this.mockSites.length)]
        });
      });
    }

    localStorage.setItem('attendance_records', JSON.stringify(this.allAttendanceRecords));
    this.applyFilters();
  }

  applyFilters() {
    this.attendanceRecords = this.allAttendanceRecords.filter(record => {
      const matchDate = !this.filterDate || record.date === this.filterDate;
      const matchStatus = !this.filterStatus || record.status === this.filterStatus;
      const matchSite = !this.filterSite || record.site === this.filterSite;

      const searchLower = this.filterSearch.toLowerCase().trim();
      const matchSearch = !searchLower ||
        record.empName.toLowerCase().includes(searchLower) ||
        record.empId.toLowerCase().includes(searchLower);

      return matchDate && matchStatus && matchSearch && matchSite;
    });
    this.p = 1;
  }

  resetFilters() {
    const today = new Date();
    this.filterDate = this.datePipe.transform(today, 'yyyy-MM-dd') || '';
    this.filterStatus = '';
    this.filterSearch = '';
    this.filterSite = '';
    this.applyFilters();
  }

  // --- Drag and Drop Logic ---

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  handleFile(file: File) {
    if (file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' &&
      file.type !== 'application/vnd.ms-excel' &&
      !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      this.notificationService.show('Invalid file type. Please upload an Excel or CSV file.', 'error', 3000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON
        const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);

        this.processUploadedData(rawData);
      } catch (error) {
        this.notificationService.show('Error parsing the file.', 'error', 3000);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  processUploadedData(data: any[]) {
    this.uploadSummary = { total: data.length, success: 0, errors: 0 };

    // Process each row
    data.forEach(row => {
      // Assuming headers: EmpID, Date, CheckIn, CheckOut (we can map alternative names if needed)
      const empId = row.EmpID || row.EmployeeID || row['Employee ID'];
      let date = row.Date;
      const checkIn = row.CheckIn || row['Check In'] || row.TimeIn || null;
      const checkOut = row.CheckOut || row['Check Out'] || row.TimeOut || null;

      if (!empId || !date) {
        this.uploadSummary.errors++;
        return;
      }

      // Parse date if it's an excel serial number
      if (typeof date === 'number') {
        const parsedDate = new Date(Math.round((date - 25569) * 86400 * 1000));
        date = this.datePipe.transform(parsedDate, 'yyyy-MM-dd') || date;
      } else if (typeof date === 'string' && date.includes('/')) {
        // Convert DD/MM/YYYY to YYYY-MM-DD
        const parts = date.split('/');
        if (parts.length === 3) {
          date = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }

      // Check freeze date
      const recordDate = new Date(date);
      if (recordDate < this.freezeDate) {
        this.uploadSummary.errors++;
        return; // Ignore locked records
      }

      // Check for future dates
      const today = new Date();
      if (recordDate > today) {
        this.uploadSummary.errors++;
        return; // Ignore future dates
      }
      
      const employee = this.employees.find(e => e.id === empId);
      if (!employee) {
        this.uploadSummary.errors++;
        return; // Employee not found
      }

      const status = this.calculateStatus(checkIn, checkOut);

      // Find if record exists in master list to update, or add new
      const existingIndex = this.allAttendanceRecords.findIndex(r => r.empId === empId && r.date === date);
      
      const newRecord: DailyAttendance = {
        id: existingIndex >= 0 ? this.allAttendanceRecords[existingIndex].id : Math.floor(Math.random() * 10000).toString(),
        empId,
        empName: employee.name,
        date,
        checkIn: this.formatTime(checkIn),
        checkOut: this.formatTime(checkOut),
        shift: employee.shift || 'General',
        status,
        site: employee.site || this.mockSites[Math.floor(Math.random() * this.mockSites.length)]
      };

      if (existingIndex >= 0) {
        this.allAttendanceRecords[existingIndex] = newRecord;
      } else {
        this.allAttendanceRecords.unshift(newRecord);
      }
      
      this.uploadSummary.success++;
    });

    localStorage.setItem('attendance_records', JSON.stringify(this.allAttendanceRecords));
    this.applyFilters();
    
    if (this.uploadSummary.success > 0) {
      this.notificationService.show(`Successfully processed ${this.uploadSummary.success} records.`, 'info', 3000);
    }
    if (this.uploadSummary.errors > 0) {
      this.notificationService.show(`Failed to process ${this.uploadSummary.errors} records (invalid data, locked date, or future date).`, 'error', 5000);
    }
  }
  
  formatTime(timeStr: any): string | null {
    if (!timeStr) return null;
    
    // Handle excel time (fraction of a day)
    if (typeof timeStr === 'number') {
      const totalSeconds = Math.round(timeStr * 86400);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    return timeStr.toString();
  }

  calculateStatus(checkIn: string | null, checkOut: string | null): 'Present' | 'Half Day' | 'Exception' | 'Absent' {
    if (!checkIn && !checkOut) return 'Absent';
    if (checkIn && !checkOut) return 'Exception';
    
    if (checkIn && checkOut) {
      // Calculate hours
      const inTime = this.timeToMinutes(checkIn);
      const outTime = this.timeToMinutes(checkOut);
      
      const diffMinutes = outTime - inTime;
      const hours = diffMinutes / 60;
      
      if (hours >= 8) return 'Present';
      if (hours >= 4) return 'Half Day';
      return 'Exception'; // Less than 4 hours but punched out
    }
    
    return 'Absent';
  }
  
  timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours * 60) + minutes;
  }

  // --- Manual Correction Logic ---

  openCorrectionModal(record: DailyAttendance) {
    // Check if locked
    const recordDate = new Date(record.date);
    if (recordDate < this.freezeDate) {
      this.notificationService.show('This record is locked and cannot be edited.', 'error', 3000);
      return;
    }

    this.selectedRecord = { ...record };
    this.correctionForm.patchValue({
      checkIn: record.checkIn === '--:--' ? '' : (record.checkIn || ''),
      checkOut: record.checkOut === '--:--' ? '' : (record.checkOut || ''),
      status: record.status,
      site: record.site,
      reason: ''
    });
    this.showCorrectionModal = true;
  }

  closeCorrectionModal() {
    this.showCorrectionModal = false;
    this.selectedRecord = null;
    this.correctionForm.reset();
  }

  submitCorrection() {
    if (this.correctionForm.invalid || !this.selectedRecord) {
      this.notificationService.show('Please fill in all required fields.', 'error', 3000);
      return;
    }

    const formValues = this.correctionForm.value;
    const { reason, status, site } = formValues;
    const newCheckIn = formValues.checkIn || null;
    const newCheckOut = formValues.checkOut || null;

    const newStatus = status as 'Present' | 'Half Day' | 'Exception' | 'Absent'; // Use the explicitly chosen status
    
    const index = this.allAttendanceRecords.findIndex(r => r.id === this.selectedRecord!.id);
    if (index >= 0) {
      // Log correction
      this.correctionLogs.unshift({
        id: Math.floor(Math.random() * 10000).toString(),
        empId: this.selectedRecord.empId,
        date: this.selectedRecord.date,
        oldCheckIn: this.selectedRecord.checkIn,
        newCheckIn,
        oldCheckOut: this.selectedRecord.checkOut,
        newCheckOut,
        oldStatus: this.selectedRecord.status,
        newStatus,
        reason,
        timestamp: new Date()
      });

      // Update record
      this.allAttendanceRecords[index].checkIn = newCheckIn;
      this.allAttendanceRecords[index].checkOut = newCheckOut;
      this.allAttendanceRecords[index].status = newStatus;
      this.allAttendanceRecords[index].site = site;
      
      localStorage.setItem('attendance_records', JSON.stringify(this.allAttendanceRecords));
      this.applyFilters();
      this.notificationService.show('Attendance record updated successfully.', 'info', 3000);
      this.closeCorrectionModal();
    }
  }

  // --- Bulk Upload Modal ---
  openBulkUploadModal() {
    this.showBulkUploadModal = true;
    this.uploadSummary = { total: 0, success: 0, errors: 0 };
  }

  closeBulkUploadModal() {
    this.showBulkUploadModal = false;
  }

  // --- Manual Entry Modal ---
  openManualEntryModal() {
    this.manualEntryForm.reset();
    this.showManualEntryModal = true;
  }

  closeManualEntryModal() {
    this.showManualEntryModal = false;
  }

  submitManualEntry() {
    if (this.manualEntryForm.invalid) {
      this.notificationService.show('Please fill in all required fields.', 'error', 3000);
      return;
    }

    const formValues = this.manualEntryForm.value;
    const { empId, date, reason, status, site } = formValues;
    const newCheckIn = formValues.checkIn || null;
    const newCheckOut = formValues.checkOut || null;

    const recordDate = new Date(date);
    if (recordDate < this.freezeDate) {
      this.notificationService.show('Cannot add entries before the freeze date.', 'error', 3000);
      return;
    }

    const employee = this.employees.find(e => e.id === empId || e.user_id === empId);
    if (!employee) {
      this.notificationService.show('Employee not found.', 'error', 3000);
      return;
    }

    const newStatus = status as 'Present' | 'Half Day' | 'Exception' | 'Absent'; // Use explicitly selected status

    // Find if record already exists
    const existingIndex = this.allAttendanceRecords.findIndex(r => r.empId === empId && r.date === date);
    if (existingIndex >= 0) {
      this.notificationService.show('Attendance record already exists for this date. Please edit the existing record instead.', 'error', 3000);
      return;
    }

    const newRecord: DailyAttendance = {
      id: Math.floor(Math.random() * 10000).toString(),
      empId,
      empName: employee.name || employee.first_name + ' ' + (employee.last_name || ''),
      date,
      checkIn: this.formatTime(newCheckIn),
      checkOut: this.formatTime(newCheckOut),
      shift: employee.shift || 'General',
      status: newStatus,
      site: site
    };

    this.allAttendanceRecords.unshift(newRecord);
    localStorage.setItem('attendance_records', JSON.stringify(this.allAttendanceRecords));
    this.applyFilters();

    this.correctionLogs.unshift({
      id: Math.floor(Math.random() * 10000).toString(),
      empId,
      date,
      oldCheckIn: null,
      newCheckIn,
      oldCheckOut: null,
      newCheckOut,
      oldStatus: 'Absent',
      newStatus,
      reason,
      timestamp: new Date()
    });

    this.notificationService.show('Manual attendance entry added successfully.', 'info', 3000);
    this.closeManualEntryModal();
  }
  
  
  getStatusClass(status: string): string {
    switch(status) {
      case 'Present': return 'bg-success text-white';
      case 'Half Day': return 'bg-warning text-dark';
      case 'Exception': return 'bg-danger text-white';
      case 'Absent': return 'bg-secondary text-white';
      case 'Leave': return 'bg-info text-white';
      default: return 'bg-light text-dark';
    }
  }
}
