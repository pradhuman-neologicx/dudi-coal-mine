import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MaterialModule } from 'src/app/mat/mat.module';
import { NgxPaginationModule } from 'ngx-pagination';
import { EmployeeService } from 'src/app/core/services/Employee.service';
import { NotificationService } from 'src/app/core/services/notificationnew.service';

interface PayrollRecord {
  empId: string;
  empName: string;
  designation: string;
  department: string;
  site: string;
  basicSalary: number;
  shiftAllowance: number;
  presentCount: number;
  halfDayCount: number;
  exceptionCount: number;
  absentCount: number;
  leaveCount: number;
  unpaidLeaveCount: number;
  pfDeduction: number;
  messDeduction: number;
  leaveDeduction: number;
  incentives: number;
  totalEarnings: number;
  totalDeductions: number;
  netSalary: number;
}

@Component({
  selector: 'app-payroll-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    NgxPaginationModule
  ],
  templateUrl: './payroll-management.component.html',
  styleUrl: './payroll-management.component.scss',
  providers: [DatePipe]
})
export class PayrollManagementComponent implements OnInit {
  employees: any[] = [];
  allAttendanceRecords: any[] = [];
  
  // Filters
  currentMonth: string = '';
  selectedSite: string = '';
  selectedDept: string = '';
  filterSearch: string = '';
  
  // State Machine
  payrollState: 'Draft' | 'Pending Verification' | 'Finalized' = 'Draft';
  
  // Calculated Payroll list
  payrollRecords: PayrollRecord[] = [];
  filteredPayrollRecords: PayrollRecord[] = [];
  
  // Pagination
  p: number = 1;
  showEntries: number = 10;
  
  // Selected Payslip for A4 Print/Preview
  selectedPayslipRecord: PayrollRecord | null = null;
  showPayslipModal: boolean = false;
  
  // Adjustments Modal (Draft mode only)
  showEditModal: boolean = false;
  editForm!: FormGroup;
  currentEditingRecord: PayrollRecord | null = null;

  // Add Manual Record Modal
  showAddModal: boolean = false;
  addForm!: FormGroup;
  
  // Dropdown options
  mockSites: string[] = ['East Mine', 'West Mine', 'North Sector'];
  departments: string[] = ['Mining', 'HR', 'Safety', 'Operations', 'Finance'];

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private notificationService: NotificationService,
    private datePipe: DatePipe
  ) {
    this.editForm = this.fb.group({
      empId: [{ value: '', disabled: true }],
      empName: [{ value: '', disabled: true }],
      incentives: [0, [Validators.required, Validators.min(0)]],
      messDeduction: [1000, [Validators.required, Validators.min(0)]],
      pfDeduction: [1800, [Validators.required, Validators.min(0)]]
    });

    this.addForm = this.fb.group({
      isCustomEmployee: [false],
      selectedEmpId: [''],
      empId: [{ value: '', disabled: true }, Validators.required],
      empName: [{ value: '', disabled: true }, Validators.required],
      designation: ['Contract Worker', Validators.required],
      department: ['Operations', Validators.required],
      site: ['East Mine', Validators.required],
      basicSalary: [20000, [Validators.required, Validators.min(0)]],
      shiftAllowance: [1500, [Validators.required, Validators.min(0)]],
      incentives: [0, [Validators.required, Validators.min(0)]],
      pfDeduction: [2000, [Validators.required, Validators.min(0)]],
      messDeduction: [1000, [Validators.required, Validators.min(0)]],
      presentCount: [26, [Validators.required, Validators.min(0)]],
      halfDayCount: [0, [Validators.required, Validators.min(0)]],
      absentCount: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    const today = new Date();
    this.currentMonth = this.datePipe.transform(today, 'yyyy-MM') || '';
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.employeeService.GetStaff('all', 1, '').subscribe({
      next: (res: any) => {
        if (res && (res.status === 'success' || res.data)) {
          const rawData = res.data || res;
          this.employees = rawData.map((emp: any) => ({
            id: emp.id || emp.user_id || 'EMP' + Math.floor(Math.random() * 1000),
            name: emp.name || (emp.first_name + ' ' + (emp.last_name || '')),
            designation: emp.designation || 'Specialist',
            department: emp.department || this.departments[Math.floor(Math.random() * this.departments.length)],
            site: emp.site || this.mockSites[Math.floor(Math.random() * this.mockSites.length)],
            basicSalary: emp.basicSalary || this.getRandomBasicSalary(),
            shiftAllowance: 1500,
            shift: emp.shift || 'A'
          }));
        } else {
          this.useFallbackEmployees();
        }
        this.loadAttendanceAndCalculate();
      },
      error: () => {
        this.useFallbackEmployees();
        this.loadAttendanceAndCalculate();
      }
    });
  }

  useFallbackEmployees(): void {
    this.employees = [
      { id: 'EMP001', name: 'John Doe', designation: 'Mining Engineer', department: 'Mining', site: 'East Mine', basicSalary: 45000, shiftAllowance: 1500, shift: 'A' },
      { id: 'EMP002', name: 'Jane Smith', designation: 'HR Manager', department: 'HR', site: 'West Mine', basicSalary: 38000, shiftAllowance: 1500, shift: 'B' },
      { id: 'EMP003', name: 'Robert Johnson', designation: 'Safety Officer', department: 'Safety', site: 'East Mine', basicSalary: 30000, shiftAllowance: 1500, shift: 'C' },
      { id: 'EMP004', name: 'Michael Brown', designation: 'Excavator Operator', department: 'Operations', site: 'East Mine', basicSalary: 25000, shiftAllowance: 1500, shift: 'A' },
      { id: 'EMP005', name: 'William Davis', designation: 'Accountant', department: 'Finance', site: 'West Mine', basicSalary: 32000, shiftAllowance: 1500, shift: 'B' }
    ];
  }

  getRandomBasicSalary(): number {
    const salaries = [22000, 25000, 30000, 35000, 42000, 45000];
    return salaries[Math.floor(Math.random() * salaries.length)];
  }

  loadAttendanceAndCalculate(): void {
    const stored = localStorage.getItem('attendance_records');
    let currentRecords = stored ? JSON.parse(stored) : [];
    
    // Check if there are records for the selected month
    const hasRecords = currentRecords.some((r: any) => r.date.startsWith(this.currentMonth));
    if (!hasRecords) {
      this.generateMockAttendanceForMonth(this.currentMonth);
    } else {
      this.allAttendanceRecords = currentRecords;
    }

    // Load Month State
    const stateKey = 'payroll_state_' + this.currentMonth;
    const storedState = localStorage.getItem(stateKey);
    this.payrollState = (storedState as 'Draft' | 'Pending Verification' | 'Finalized') || 'Draft';

    this.calculatePayroll();
  }

  generateMockAttendanceForMonth(monthStr: string): void {
    const [year, month] = monthStr.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const stored = localStorage.getItem('attendance_records');
    const existingRecords = stored ? JSON.parse(stored) : [];
    const otherMonthRecords = existingRecords.filter((r: any) => !r.date.startsWith(monthStr));
    const newRecords: any[] = [];

    this.employees.forEach(emp => {
      for (let day = 1; day <= daysInMonth; day++) {
        const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        let status: 'Present' | 'Half Day' | 'Exception' | 'Absent' | 'Leave' = 'Present';
        let checkIn = '08:00';
        let checkOut = '17:00';
        
        const rand = Math.random();
        if (rand < 0.05) {
          status = 'Absent';
          checkIn = '--:--';
          checkOut = '--:--';
        } else if (rand < 0.12) {
          status = 'Half Day';
          checkIn = '08:00';
          checkOut = '12:30';
        } else if (rand < 0.16) {
          status = 'Exception';
          checkIn = '08:20';
          checkOut = '--:--';
        } else if (rand < 0.20) {
          status = 'Leave'; // Approved Leave
          checkIn = '--:--';
          checkOut = '--:--';
        }

        newRecords.push({
          id: 'PAY-' + emp.id + '-' + dateString,
          empId: emp.id,
          empName: emp.name,
          date: dateString,
          checkIn: checkIn,
          checkOut: checkOut,
          shift: emp.shift || 'A',
          status: status,
          site: emp.site || 'East Mine'
        });
      }
    });

    const updated = [...otherMonthRecords, ...newRecords];
    localStorage.setItem('attendance_records', JSON.stringify(updated));
    this.allAttendanceRecords = updated;
  }

  calculatePayroll(): void {
    const [year, month] = this.currentMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();

    // Load adjustments
    const adjKey = 'payroll_adjustments_' + this.currentMonth;
    const storedAdj = localStorage.getItem(adjKey);
    const adjustments = storedAdj ? JSON.parse(storedAdj) : {};

    const autoRecords = this.employees.map(emp => {
      const empId = emp.id;
      const empRecords = this.allAttendanceRecords.filter(r => r.empId === empId && r.date.startsWith(this.currentMonth));

      // Aggregate counts
      const presentCount = empRecords.filter(r => r.status === 'Present').length;
      const halfDayCount = empRecords.filter(r => r.status === 'Half Day').length;
      const exceptionCount = empRecords.filter(r => r.status === 'Exception').length;
      const absentCount = empRecords.filter(r => r.status === 'Absent').length;
      const leaveCount = empRecords.filter(r => r.status === 'Leave').length; // Paid Leave
      const unpaidLeaveCount = empRecords.filter(r => r.status === 'Unpaid Leave').length;

      // Adjustments (PF, Mess, Incentives)
      const empAdj = adjustments[empId] || {};
      const pfDeduction = empAdj.pf !== undefined ? empAdj.pf : Math.round(emp.basicSalary * 0.1);
      const messDeduction = empAdj.mess !== undefined ? empAdj.mess : 1000;
      const incentives = empAdj.incentives !== undefined ? empAdj.incentives : 0;

      // Calculations
      const dailyRate = emp.basicSalary / daysInMonth;
      
      // Leave Deductions: Absent & Unpaid Leave = 1.0 day rate; Half Day & Exception = 0.5 day rate
      const leaveDeduction = dailyRate * ((absentCount + unpaidLeaveCount) + 0.5 * (halfDayCount + exceptionCount));

      const shiftAllowance = emp.shiftAllowance || 1500;
      const totalEarnings = emp.basicSalary + shiftAllowance + incentives;
      const totalDeductions = pfDeduction + messDeduction + leaveDeduction;
      const netSalary = Math.max(0, totalEarnings - totalDeductions);

      return {
        empId,
        empName: emp.name,
        designation: emp.designation,
        department: emp.department,
        site: emp.site,
        basicSalary: emp.basicSalary,
        shiftAllowance,
        presentCount,
        halfDayCount,
        exceptionCount,
        absentCount,
        leaveCount,
        unpaidLeaveCount,
        pfDeduction,
        messDeduction,
        leaveDeduction: Math.round(leaveDeduction * 100) / 100,
        incentives,
        totalEarnings: Math.round(totalEarnings),
        totalDeductions: Math.round(totalDeductions),
        netSalary: Math.round(netSalary)
      };
    });

    // Load manual records
    const manualKey = 'payroll_manual_records_' + this.currentMonth;
    const storedManual = localStorage.getItem(manualKey);
    const manualRecordsList = storedManual ? JSON.parse(storedManual) : [];

    // Map manual records and calculate
    const processedManualRecords = manualRecordsList.map((m: any) => {
      const dailyRate = m.basicSalary / daysInMonth;
      const leaveDeduction = dailyRate * (m.absentCount + 0.5 * m.halfDayCount);

      // Check adjustments for overrides on this manual record
      const empAdj = adjustments[m.empId] || {};
      const pfDeduction = empAdj.pf !== undefined ? empAdj.pf : m.pfDeduction;
      const messDeduction = empAdj.mess !== undefined ? empAdj.mess : m.messDeduction;
      const incentives = empAdj.incentives !== undefined ? empAdj.incentives : m.incentives;

      const totalEarnings = m.basicSalary + m.shiftAllowance + incentives;
      const totalDeductions = pfDeduction + messDeduction + leaveDeduction;
      const netSalary = Math.max(0, totalEarnings - totalDeductions);

      return {
        empId: m.empId,
        empName: m.empName,
        designation: m.designation || 'Contract Worker',
        department: m.department || 'Operations',
        site: m.site || 'East Mine',
        basicSalary: m.basicSalary,
        shiftAllowance: m.shiftAllowance,
        presentCount: m.presentCount || 0,
        halfDayCount: m.halfDayCount || 0,
        exceptionCount: 0,
        absentCount: m.absentCount || 0,
        leaveCount: 0,
        unpaidLeaveCount: 0,
        pfDeduction,
        messDeduction,
        leaveDeduction: Math.round(leaveDeduction * 100) / 100,
        incentives,
        totalEarnings: Math.round(totalEarnings),
        totalDeductions: Math.round(totalDeductions),
        netSalary: Math.round(netSalary)
      };
    });

    // Combine they: auto calculations + manuals (manual record override matching ids, though they should be distinct)
    const combined = [...autoRecords];
    processedManualRecords.forEach((mr: any) => {
      if (!combined.some(r => r.empId === mr.empId)) {
        combined.push(mr);
      }
    });

    this.payrollRecords = combined;
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredPayrollRecords = this.payrollRecords.filter(rec => {
      const matchSite = !this.selectedSite || rec.site === this.selectedSite;
      const matchDept = !this.selectedDept || rec.department === this.selectedDept;
      
      const search = this.filterSearch.toLowerCase().trim();
      const matchSearch = !search ||
        rec.empName.toLowerCase().includes(search) ||
        rec.empId.toLowerCase().includes(search);

      return matchSite && matchDept && matchSearch;
    });
    this.p = 1;
  }

  resetFilters(): void {
    this.selectedSite = '';
    this.selectedDept = '';
    this.filterSearch = '';
    this.applyFilters();
  }

  onMonthChange(): void {
    this.loadAttendanceAndCalculate();
  }

  // Workflow transitions
  submitForVerification(): void {
    this.payrollState = 'Pending Verification';
    localStorage.setItem('payroll_state_' + this.currentMonth, this.payrollState);
    this.notificationService.show('Payroll submitted for Verification successfully!', 'success', 3000);
  }

  finalizePayroll(): void {
    this.payrollState = 'Finalized';
    localStorage.setItem('payroll_state_' + this.currentMonth, this.payrollState);
    this.notificationService.show('Payroll approved and Finalized successfully!', 'success', 3000);
  }

  rejectToDraft(): void {
    this.payrollState = 'Draft';
    localStorage.setItem('payroll_state_' + this.currentMonth, this.payrollState);
    this.notificationService.show('Payroll rejected and sent back to Draft.', 'success', 3000);
  }

  // Manual Entry CRUD Operations
  openAddModal(): void {
    if (this.payrollState !== 'Draft') return;
    this.addForm.reset({
      isCustomEmployee: false,
      selectedEmpId: '',
      empId: '',
      empName: '',
      designation: 'Contract Worker',
      department: 'Operations',
      site: 'East Mine',
      basicSalary: 20000,
      shiftAllowance: 1500,
      incentives: 0,
      pfDeduction: 2000,
      messDeduction: 1000,
      presentCount: 26,
      halfDayCount: 0,
      absentCount: 0
    });
    this.addForm.get('empId')?.disable();
    this.addForm.get('empName')?.disable();
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  onCustomEmployeeToggle(): void {
    const isCustom = this.addForm.get('isCustomEmployee')?.value;
    if (isCustom) {
      this.addForm.get('selectedEmpId')?.setValue('');
      this.addForm.get('empId')?.enable();
      this.addForm.get('empName')?.enable();
      this.addForm.patchValue({
        empId: 'EMP' + Math.floor(Math.random() * 9000 + 1000),
        empName: ''
      });
    } else {
      this.addForm.get('empId')?.disable();
      this.addForm.get('empName')?.disable();
      this.addForm.patchValue({
        empId: '',
        empName: ''
      });
    }
  }

  onEmployeeSelectChange(): void {
    const isCustom = this.addForm.get('isCustomEmployee')?.value;
    if (isCustom) return;

    const empId = this.addForm.get('selectedEmpId')?.value;
    const selectedEmp = this.employees.find(e => e.id === empId);
    if (selectedEmp) {
      this.addForm.patchValue({
        empId: selectedEmp.id,
        empName: selectedEmp.name,
        designation: selectedEmp.designation,
        department: selectedEmp.department,
        site: selectedEmp.site,
        basicSalary: selectedEmp.basicSalary,
        pfDeduction: Math.round(selectedEmp.basicSalary * 0.1)
      });
    }
  }

  onBasicSalaryChange(): void {
    const basic = this.addForm.get('basicSalary')?.value || 0;
    this.addForm.patchValue({
      pfDeduction: Math.round(basic * 0.1)
    });
  }

  submitManualRecord(): void {
    if (this.addForm.valid) {
      const rawVal = this.addForm.getRawValue();
      const manualKey = 'payroll_manual_records_' + this.currentMonth;
      const stored = localStorage.getItem(manualKey);
      const manualRecordsList = stored ? JSON.parse(stored) : [];

      // Check if duplicate ID exists
      const idExists = this.payrollRecords.some(r => r.empId === rawVal.empId);
      if (idExists) {
        this.notificationService.show(`Employee ID ${rawVal.empId} is already in the payroll list.`, 'error', 3000);
        return;
      }

      manualRecordsList.push(rawVal);
      localStorage.setItem(manualKey, JSON.stringify(manualRecordsList));

      this.notificationService.show(`Manual payroll record added for ${rawVal.empName}`, 'success', 3000);
      this.closeAddModal();
      this.calculatePayroll();
    } else {
      this.addForm.markAllAsTouched();
    }
  }

  isManualRecord(empId: string): boolean {
    const manualKey = 'payroll_manual_records_' + this.currentMonth;
    const stored = localStorage.getItem(manualKey);
    const manualRecordsList = stored ? JSON.parse(stored) : [];
    return manualRecordsList.some((r: any) => r.empId === empId);
  }

  deleteManualRecord(empId: string): void {
    if (this.payrollState !== 'Draft') return;
    if (confirm('Are you sure you want to delete this manual payroll record?')) {
      const manualKey = 'payroll_manual_records_' + this.currentMonth;
      const stored = localStorage.getItem(manualKey);
      let manualRecordsList = stored ? JSON.parse(stored) : [];
      manualRecordsList = manualRecordsList.filter((r: any) => r.empId !== empId);
      localStorage.setItem(manualKey, JSON.stringify(manualRecordsList));
      
      // Also delete adjustments if any
      const adjKey = 'payroll_adjustments_' + this.currentMonth;
      const storedAdj = localStorage.getItem(adjKey);
      if (storedAdj) {
        const adjustments = JSON.parse(storedAdj);
        delete adjustments[empId];
        localStorage.setItem(adjKey, JSON.stringify(adjustments));
      }

      this.notificationService.show('Manual payroll record deleted.', 'success', 3000);
      this.calculatePayroll();
    }
  }

  // Edit Adjustments
  openEditModal(rec: PayrollRecord): void {
    if (this.payrollState !== 'Draft') return;
    
    this.currentEditingRecord = rec;
    this.editForm.patchValue({
      empId: rec.empId,
      empName: rec.empName,
      pfDeduction: rec.pfDeduction,
      messDeduction: rec.messDeduction,
      incentives: rec.incentives
    });
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.currentEditingRecord = null;
  }

  submitAdjustments(): void {
    if (this.editForm.valid && this.currentEditingRecord) {
      const formVal = this.editForm.value;
      const adjKey = 'payroll_adjustments_' + this.currentMonth;
      const storedAdj = localStorage.getItem(adjKey);
      const adjustments = storedAdj ? JSON.parse(storedAdj) : {};

      adjustments[this.currentEditingRecord.empId] = {
        pf: formVal.pfDeduction,
        mess: formVal.messDeduction,
        incentives: formVal.incentives
      };

      localStorage.setItem(adjKey, JSON.stringify(adjustments));
      this.notificationService.show(`Adjustments saved for ${this.currentEditingRecord.empName}`, 'success', 3000);
      this.closeEditModal();
      this.calculatePayroll();
    }
  }

  // Payslip Actions
  viewPayslip(rec: PayrollRecord): void {
    this.selectedPayslipRecord = rec;
    this.showPayslipModal = true;
  }

  closePayslipModal(): void {
    this.showPayslipModal = false;
    this.selectedPayslipRecord = null;
  }

  printPayslip(): void {
    setTimeout(() => {
      window.print();
    }, 100);
  }

  downloadMockPDF(): void {
    if (!this.selectedPayslipRecord) return;
    
    const rec = this.selectedPayslipRecord;
    const content = `========================================================================
                          DUDI COAL MINE PVT. LTD.
           East Mine Sector, Block-A, Jharia Coalfield, Dhanbad, Jharkhand
========================================================================
                       PAYSLIP FOR THE MONTH OF: ${this.formatMonthName(this.currentMonth).toUpperCase()}
========================================================================
EMPLOYEE DETAILS:
------------------------------------------------------------------------
Employee ID     : ${rec.empId}             Designation   : ${rec.designation}
Employee Name   : ${rec.empName}             Department    : ${rec.department}
Location/Site   : ${rec.site}             Bank A/C No   : ********5432 (Mock)
========================================================================
EARNINGS (Rs.)                         DEDUCTIONS (Rs.)
------------------------------------------------------------------------
Basic Salary    : ${rec.basicSalary.toLocaleString()}         PF Deduction    : ${rec.pfDeduction.toLocaleString()}
Shift Allowance : ${rec.shiftAllowance.toLocaleString()}         Mess Deduction  : ${rec.messDeduction.toLocaleString()}
Incentives      : ${rec.incentives.toLocaleString()}         Leave Deduction : ${rec.leaveDeduction.toLocaleString()}
                                       (P: ${rec.presentCount}, HD: ${rec.halfDayCount}, A: ${rec.absentCount}, L: ${rec.leaveCount})
------------------------------------------------------------------------
TOTAL EARNINGS  : ${rec.totalEarnings.toLocaleString()}         TOTAL DEDUCTIONS: ${rec.totalDeductions.toLocaleString()}
========================================================================
NET SALARY PAID : Rs. ${rec.netSalary.toLocaleString()}/-
In Words        : Rupees ${this.numberToWords(rec.netSalary)} Only.
========================================================================
This is a computer-generated payslip and does not require an authorized signature.
========================================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Payslip_${rec.empId}_${this.currentMonth}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
    this.notificationService.show('Mock PDF Payslip downloaded successfully!', 'success', 2500);
  }

  // Utility helpers
  formatMonthName(monthStr: string): string {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return this.datePipe.transform(date, 'MMMM yyyy') || monthStr;
  }

  numberToWords(num: number): string {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    const n = Math.floor(num);
    if (n === 0) return 'Zero';
    
    const convert = (val: number): string => {
      let str = '';
      if (val >= 100) {
        str += a[Math.floor(val / 100)] + 'Hundred ';
        val %= 100;
        if (val > 0) str += 'and ';
      }
      if (val >= 20) {
        str += b[Math.floor(val / 10)] + ' ' + a[val % 10];
      } else if (val > 0) {
        str += a[val];
      }
      return str;
    };

    let res = '';
    const crore = Math.floor(n / 10000000);
    const lakh = Math.floor((n % 10000000) / 100000);
    const thousand = Math.floor((n % 100000) / 1000);
    const remaining = n % 1000;

    if (crore > 0) res += convert(crore) + 'Crore ';
    if (lakh > 0) res += convert(lakh) + 'Lakh ';
    if (thousand > 0) res += convert(thousand) + 'Thousand ';
    if (remaining > 0) res += convert(remaining);

    return res.trim();
  }
}
