
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { NotificationService } from 'src/app/core/services/notificationnew.service';
import { ShiftService } from 'src/app/core/services/shift.service';

@Component({
  selector: 'app-shift-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './shift-management.component.html',
  styleUrl: './shift-management.component.scss',
  animations: [
    trigger('fadeIn', [
      state(
        'void',
        style({
          opacity: 0,
          transform: 'scale(0.95)',
        }),
      ),
      transition(':enter', [
        animate(
          '0.3s ease-out',
          style({
            opacity: 1,
            transform: 'scale(1)',
          }),
        ),
      ]),
      transition(':leave', [
        animate(
          '0.2s ease-in',
          style({
            opacity: 0,
            transform: 'scale(0.95)',
          }),
        ),
      ]),
    ]),
  ]
})
export class ShiftManagementComponent implements OnInit {
  currentDate = new Date();
  activeWeekDays: any[] = [];
  isOverrideModalOpen = false;
  overrideForm!: FormGroup;
  isBulkRotateModalOpen = false;
  bulkRotateForm!: FormGroup;
  shiftGroups: { [groupName: string]: string[] } = {};

  // Tab and Week/Month filtering state
  activeTab: string = 'Shift A';
  weeksList: any[] = [];
  selectedWeekMondayStr: string = '';
  selectedMonth: string = '2026-05';
  monthsList = [
    { label: 'May 2026', value: '2026-05' },
    { label: 'June 2026', value: '2026-06' },
    { label: 'July 2026', value: '2026-07' }
  ];

  // Details Modal state
  isDetailsModalOpen = false;
  selectedEmployeeForDetails: any = null;

  // Predefined shifts
  shifts = [
    { code: 'Shift A', name: 'Shift A (Morning)', time: '06:00 - 14:00', badgeClass: 'shift-a-badge' },
    { code: 'Shift B', name: 'Shift B (Afternoon)', time: '14:00 - 22:00', badgeClass: 'shift-b-badge' },
    { code: 'Shift C', name: 'Shift C (Night)', time: '22:00 - 06:00', badgeClass: 'shift-c-badge' },
    { code: 'Off', name: 'Weekly Off', time: 'Rest Day', badgeClass: 'shift-off-badge' }
  ];

  // Mock list of employees with advanced enterprise metadata
  employees = [
    { id: '1', empId: 'EMP-001', name: 'Ramesh Kumar', designation: 'Drill Operator', department: 'Mining Operations', location: 'East Mine (Section A)', rotationGroup: 'Group Alpha', rotationPattern: '[A] → [C] → [B]' },
    { id: '2', empId: 'EMP-002', name: 'Suresh Singh', designation: 'Blasting Specialist', department: 'Safety & Excavation', location: 'West Pit (Section B)', rotationGroup: 'Group Beta', rotationPattern: '[B] → [A] → [C]' },
    { id: '3', empId: 'EMP-003', name: 'Anita Sharma', designation: 'Shift In-Charge', department: 'Operations Management', location: 'Central Control Hub', rotationGroup: 'Group Alpha', rotationPattern: '[A] → [C] → [B]' },
    { id: '4', empId: 'EMP-004', name: 'Rajesh Patel', designation: 'Haul Truck Driver', department: 'Heavy Machinery', location: 'East Mine (Section C)', rotationGroup: 'Group Gamma', rotationPattern: '[C] → [B] → [A]' },
    { id: '5', empId: 'EMP-005', name: 'Amit Sen', designation: 'Excavator Operator', department: 'Heavy Machinery', location: 'West Pit (Section A)', rotationGroup: 'Group Beta', rotationPattern: '[B] → [A] → [C]' },
    { id: '6', empId: 'EMP-006', name: 'Vikram Singh', designation: 'Safety Inspector', department: 'Safety & Excavation', location: 'Central Mine Site', rotationGroup: 'Group Alpha', rotationPattern: '[A] → [C] → [B]' }
  ];

  // Shift Assignments Roster: { [empId]: { [dateStr]: shiftCode } }
  shiftAssignments: { [empId: string]: { [dateStr: string]: string } } = {};

  // Audit Logs
  rotationLogs: any[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private notificationService: NotificationService,
    private shiftService: ShiftService
  ) { }

  ngOnInit(): void {
    // Generate active week days starting with Monday
    this.currentDate = this.getMonday(new Date());
    this.generateActiveWeekDays(this.currentDate);
    this.initRosterForWeek(this.currentDate);
    this.generateWeeksList();
    this.selectedWeekMondayStr = this.formatDateStr(this.currentDate);
    this.initOverrideForm();
    this.initBulkRotateForm();
    this.loadShiftGroups();

    // Seed initial logs
    this.rotationLogs = [
      {
        id: 'L001',
        timestamp: new Date(Date.now() - 3600000 * 24),
        type: 'Auto-Rotation',
        description: 'System automatically rotated all employee shifts for week using A->C, B->A, C->B rotation.',
        supervisor: 'System Scheduler'
      },
      {
        id: 'L002',
        timestamp: new Date(Date.now() - 3600000 * 2),
        type: 'Shift Override',
        description: 'Manually changed Rajesh Patel\'s shift on Tuesday to Off.',
        supervisor: 'Supervisor Admin'
      }
    ];
  }

  // Returns Monday of the week containing date d
  getMonday(d: Date): Date {
    const dateCopy = new Date(d);
    const day = dateCopy.getDay();
    const diff = dateCopy.getDate() - day + (day === 0 ? -6 : 1);
    dateCopy.setDate(diff);
    dateCopy.setHours(0, 0, 0, 0);
    return dateCopy;
  }

  formatDateStr(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  generateActiveWeekDays(startMonday: Date) {
    this.activeWeekDays = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startMonday);
      dayDate.setDate(startMonday.getDate() + i);
      const dateStr = this.formatDateStr(dayDate);
      const name = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][i];
      const shortLabel = dayDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      this.activeWeekDays.push({
        name,
        dateStr,
        label: `${name.substring(0, 3)} ${shortLabel}`,
        date: dayDate
      });
    }
  }

  // Generates roster values if not present
  initRosterForWeek(weekStartMonday: Date) {
    const stored = localStorage.getItem('shiftAssignments');
    const localAssignments = stored ? JSON.parse(stored) : {};

    this.employees.forEach(emp => {
      if (!this.shiftAssignments[emp.id]) {
        this.shiftAssignments[emp.id] = {};
      }

      // Pre-merge localStorage values for this employee ID or code to ensure updates show immediately
      if (localAssignments[emp.id]) {
        Object.assign(this.shiftAssignments[emp.id], localAssignments[emp.id]);
      }
      if (emp.empId && localAssignments[emp.empId]) {
        Object.assign(this.shiftAssignments[emp.id], localAssignments[emp.empId]);
      }

      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(weekStartMonday);
        dayDate.setDate(weekStartMonday.getDate() + i);
        const dayStr = this.formatDateStr(dayDate);

        if (localAssignments[emp.id] && localAssignments[emp.id][dayStr]) {
          this.shiftAssignments[emp.id][dayStr] = localAssignments[emp.id][dayStr];
        } else if (emp.empId && localAssignments[emp.empId] && localAssignments[emp.empId][dayStr]) {
          this.shiftAssignments[emp.id][dayStr] = localAssignments[emp.empId][dayStr];
        }

        if (!this.shiftAssignments[emp.id][dayStr]) {
          // Default Seeding: Sat-Sun Off, Mon-Fri rotating
          if (i >= 5) {
            this.shiftAssignments[emp.id][dayStr] = 'Off';
          } else {
            if (emp.id === '1' || emp.id === '3') {
              this.shiftAssignments[emp.id][dayStr] = 'Shift A';
            } else if (emp.id === '2' || emp.id === '5') {
              this.shiftAssignments[emp.id][dayStr] = 'Shift B';
            } else {
              this.shiftAssignments[emp.id][dayStr] = 'Shift C';
            }
          }
        }
      }
    });
  }

  // Week navigation
  navigateWeek(offset: number) {
    const monday = new Date(this.currentDate);
    monday.setDate(monday.getDate() + offset * 7);
    this.currentDate = monday;
    this.generateActiveWeekDays(this.currentDate);
    this.initRosterForWeek(this.currentDate);
    this.selectedWeekMondayStr = this.formatDateStr(this.currentDate);
  }

  getWeekRangeLabel(): string {
    if (this.activeWeekDays.length === 0) return '';
    const start = this.activeWeekDays[0].date;
    const end = this.activeWeekDays[6].date;
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
  }

  // Pre-generates list of weeks for the week-wise dropdown filter
  generateWeeksList() {
    this.weeksList = [];
    const todayMonday = this.getMonday(new Date());
    // Pre-generate 3 weeks in the past and 4 weeks in the future
    for (let i = -3; i <= 4; i++) {
      const wMonday = new Date(todayMonday);
      wMonday.setDate(todayMonday.getDate() + i * 7);
      const wSunday = new Date(wMonday);
      wSunday.setDate(wMonday.getDate() + 6);
      
      const label = `${wMonday.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} - ${wSunday.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      const value = this.formatDateStr(wMonday);
      this.weeksList.push({ label, value });
    }
  }

  // Triggers when supervisor selects a week from the dropdown filter
  onWeekFilterChange(mondayStr: string) {
    if (!mondayStr) return;
    const parts = mondayStr.split('-');
    const selectedDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    this.currentDate = selectedDate;
    this.generateActiveWeekDays(this.currentDate);
    this.initRosterForWeek(this.currentDate);
  }

  // Retrieves employees actively assigned to a specific shift for the current week
  getEmployeesForActiveShift(shiftCode: string): any[] {
    const checkDateStr = this.activeWeekDays[2]?.dateStr || this.formatDateStr(new Date());
    const list: any[] = [];
    this.employees.forEach(emp => {
      const assigned = this.shiftAssignments[emp.id]?.[checkDateStr] || 'Off';
      if (assigned === shiftCode) {
        list.push(emp);
      }
    });
    return list;
  }

  // Calculates the monthly breakdown of shift assignments for an employee with advanced categories
  getMonthlyBreakdown(empId: string): { shiftACount: number, shiftBCount: number, shiftCCount: number, offCount: number, leaveCount: number, overrideCount: number } {
    let shiftACount = 0;
    let shiftBCount = 0;
    let shiftCCount = 0;
    let offCount = 0;
    let leaveCount = 0;
    let overrideCount = 0;
    
    const days = this.getDaysInMonthListForMetrics(empId);
    days.forEach(day => {
      if (day.shiftCode === 'Shift A') shiftACount++;
      else if (day.shiftCode === 'Shift B') shiftBCount++;
      else if (day.shiftCode === 'Shift C') shiftCCount++;
      else if (day.shiftCode === 'Leave') leaveCount++;
      else offCount++;
      
      if (day.isManualOverride) overrideCount++;
    });
    
    return { shiftACount, shiftBCount, shiftCCount, offCount, leaveCount, overrideCount };
  }

  // Locates the next active scheduled shift for an employee starting from today
  getNextShift(empId: string): { shiftCode: string, dateStr: string, timeLabel: string } | null {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const empAssignments = this.shiftAssignments[empId];
    if (!empAssignments) return null;
    
    const dates = Object.keys(empAssignments).sort();
    for (const dateStr of dates) {
      const d = new Date(dateStr);
      if (d >= today) {
        const shiftCode = empAssignments[dateStr];
        if (shiftCode !== 'Off') {
          const matched = this.shifts.find(s => s.code === shiftCode);
          return {
            shiftCode,
            dateStr: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
            timeLabel: matched ? matched.time : ''
          };
        }
      }
    }
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const fallbackShift = empId === '1' || empId === '3' ? 'Shift A' : empId === '2' || empId === '5' ? 'Shift B' : 'Shift C';
    const matched = this.shifts.find(s => s.code === fallbackShift);
    return {
      shiftCode: fallbackShift,
      dateStr: tomorrow.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      timeLabel: matched ? matched.time : '06:00 - 14:00'
    };
  }

  // Open the monthly details calendar modal
  openDetailsModal(emp: any) {
    this.selectedEmployeeForDetails = emp;
    this.isDetailsModalOpen = true;
  }

  // Close the monthly details calendar modal
  closeDetailsModal() {
    this.isDetailsModalOpen = false;
    this.selectedEmployeeForDetails = null;
  }

  // Generates complete days list for the selected month to render the calendar grid with advanced features
  getDaysInMonthList(): any[] {
    if (!this.selectedMonth) return [];
    const parts = this.selectedMonth.split('-');
    const year = Number(parts[0]);
    const month = Number(parts[1]); // 1-indexed
    
    const numDays = new Date(year, month, 0).getDate();
    const list: any[] = [];
    
    for (let i = 1; i <= numDays; i++) {
      const date = new Date(year, month - 1, i);
      const dateStr = this.formatDateStr(date);
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
      
      let assignedShift = 'Off';
      let isManualOverride = false;
      let attendanceStatus: 'Present' | 'Absent' | 'Missing Punch' | 'Late Mark' | 'Half Day' | null = null;
      
      if (this.selectedEmployeeForDetails) {
        const empId = this.selectedEmployeeForDetails.id;
        
        if (i === 1) {
          assignedShift = 'Holiday';
        } else if (i === 10 || i === 11) {
          assignedShift = 'Leave';
        } else {
          assignedShift = this.shiftAssignments[empId]?.[dateStr] || '';
          if (!assignedShift) {
            const dayOfWeek = date.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
              assignedShift = 'Off';
            } else {
              if (empId === '1' || empId === '3' || empId === '6') {
                assignedShift = 'Shift A';
              } else if (empId === '2' || empId === '5') {
                assignedShift = 'Shift B';
              } else {
                assignedShift = 'Shift C';
              }
            }
          }
        }
        
        if (assignedShift !== 'Off' && assignedShift !== 'Leave' && assignedShift !== 'Holiday') {
          if (i % 7 === 0) {
            isManualOverride = true;
          }
        }
        
        if (assignedShift !== 'Off' && assignedShift !== 'Leave' && assignedShift !== 'Holiday') {
          if (i === 4 || i === 16) {
            attendanceStatus = 'Missing Punch';
          } else if (i === 8 || i === 22) {
            attendanceStatus = 'Late Mark';
          } else if (i === 15) {
            attendanceStatus = 'Half Day';
          } else if (i === 24) {
            attendanceStatus = 'Absent';
          } else {
            attendanceStatus = 'Present';
          }
        }
      }
      
      let timeLabel = 'Rest Day';
      if (assignedShift === 'Shift A') timeLabel = '06:00 AM – 02:00 PM';
      else if (assignedShift === 'Shift B') timeLabel = '02:00 PM – 10:00 PM';
      else if (assignedShift === 'Shift C') timeLabel = '10:00 PM – 06:00 AM';
      else if (assignedShift === 'Leave') timeLabel = 'Approved Leave';
      else if (assignedShift === 'Holiday') timeLabel = 'Public Holiday';
      
      list.push({
        dayNum: i,
        dayName,
        dateStr,
        shiftCode: assignedShift,
        timeLabel,
        isManualOverride,
        attendanceStatus,
        isFatigue: false,
        isConflict: false
      });
    }
    
    for (let i = 0; i < list.length; i++) {
      if (list[i].shiftCode === 'Shift C') {
        let nightCount = 1;
        let k = i - 1;
        while (k >= 0 && list[k].shiftCode === 'Shift C') {
          nightCount++;
          k--;
        }
        let j = i + 1;
        while (j < list.length && list[j].shiftCode === 'Shift C') {
          nightCount++;
          j++;
        }
        if (nightCount >= 3) {
          list[i].isFatigue = true;
        }
      }
      
      if (list[i].dayNum === 18) {
        list[i].isConflict = true;
      }
    }
    
    return list;
  }

  getMonthStartOffset(): number[] {
    if (!this.selectedMonth) return [];
    const parts = this.selectedMonth.split('-');
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const firstDay = new Date(year, month - 1, 1).getDay(); // 0 is Sunday, 1 is Monday, etc.
    return Array(firstDay).fill(0);
  }

  getWeeksWithDays(): any[] {
    if (!this.selectedMonth) return [];
    const days = this.getDaysInMonthList();
    return [
      { name: 'Week 1', label: '01 to 07', days: days.filter(d => d.dayNum >= 1 && d.dayNum <= 7) },
      { name: 'Week 2', label: '08 to 14', days: days.filter(d => d.dayNum >= 8 && d.dayNum <= 14) },
      { name: 'Week 3', label: '15 to 21', days: days.filter(d => d.dayNum >= 15 && d.dayNum <= 21) },
      { name: 'Week 4', label: '22 to End', days: days.filter(d => d.dayNum >= 22) }
    ];
  }

  getDaysInMonthListForMetrics(empId: string): any[] {
    const tempEmp = this.selectedEmployeeForDetails;
    const targetEmp = this.employees.find(e => e.id === empId);
    this.selectedEmployeeForDetails = targetEmp;
    const list = this.getDaysInMonthList();
    this.selectedEmployeeForDetails = tempEmp;
    return list;
  }

  getEmployeeAuditLogs(empId: string): any[] {
    const emp = this.employees.find(e => e.id === empId);
    if (!emp) return [];
    
    return [
      {
        timestamp: new Date('2026-05-24T09:30:00'),
        type: 'Shift Swap',
        changedBy: 'Supervisor Admin',
        reason: 'Operational necessity (excavator breakdown coverage)',
        description: `Swapped shift for ${emp.name} from Shift B to Shift C on 24 May 2026.`
      },
      {
        timestamp: new Date('2026-05-18T14:20:00'),
        type: 'Conflict Resolved',
        changedBy: 'System Scheduler',
        reason: 'Rest compliance check',
        description: `Roster conflict flag resolved automatically. 11-hour rest period between shifts validated.`
      },
      {
        timestamp: new Date('2026-05-12T08:00:00'),
        type: 'Manual Override',
        changedBy: 'Supervisor Admin',
        reason: 'Personal request (family emergency)',
        description: `Manually changed shift for ${emp.name} from Shift A to Off on 12 May 2026.`
      },
      {
        timestamp: new Date('2026-05-01T00:00:00'),
        type: 'Roster Finalized',
        changedBy: 'Planning Manager',
        reason: 'Monthly roster lock',
        description: `Roster locked and finalized for the active block.`
      }
    ];
  }

  exportShiftHistory(emp: any) {
    this.notificationService.show(`Roster history exported successfully for ${emp.name} (PDF & CSV format).`, 'success', 3000);
  }

  navigateMonth(offset: number) {
    if (!this.selectedMonth) return;
    const parts = this.selectedMonth.split('-');
    let year = Number(parts[0]);
    let month = Number(parts[1]);
    
    month += offset;
    if (month > 12) {
      month = 1;
      year += 1;
    } else if (month < 1) {
      month = 12;
      year -= 1;
    }
    
    const mStr = String(month).padStart(2, '0');
    this.selectedMonth = `${year}-${mStr}`;
  }

  // Safely converts 'YYYY-MM' strings into 'Month YYYY' for robust template rendering without DatePipe crashes
  getSelectedMonthLabel(): string {
    if (!this.selectedMonth) return '';
    const parts = this.selectedMonth.split('-');
    const year = parts[0];
    const monthIndex = Number(parts[1]) - 1;
    const monthName = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][monthIndex];
    return `${monthName} ${year}`;
  }  // Generates weekly shift journey details for a visual scanned timeline grouped by weeks
  getWeeklyJourney(empId: string): any[] {
    if (!this.selectedMonth) return [];
    const parts = this.selectedMonth.split('-');
    const year = Number(parts[0]);
    const month = Number(parts[1]); // 1-indexed
    
    const numDays = new Date(year, month, 0).getDate();
    const journey: any[] = [];
    
    const weekRanges = [
      { start: 1, end: 7, name: 'Week 1' },
      { start: 8, end: 14, name: 'Week 2' },
      { start: 15, end: 21, name: 'Week 3' },
      { start: 22, end: numDays, name: 'Week 4' }
    ];
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthLabel = monthNames[month - 1];
    
    weekRanges.forEach(w => {
      let shiftACount = 0;
      let shiftBCount = 0;
      let shiftCCount = 0;
      let hasOverride = false;
      
      for (let d = w.start; d <= w.end; d++) {
        const date = new Date(year, month - 1, d);
        const dateStr = this.formatDateStr(date);
        
        let assigned = this.shiftAssignments[empId]?.[dateStr] || '';
        if (!assigned) {
          const dayOfWeek = date.getDay();
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            assigned = 'Off';
          } else {
            if (empId === '1' || empId === '3' || empId === '6') {
              assigned = 'Shift A';
            } else if (empId === '2' || empId === '5') {
              assigned = 'Shift B';
            } else {
              assigned = 'Shift C';
            }
          }
        }
        
        if (assigned === 'Shift A') shiftACount++;
        else if (assigned === 'Shift B') shiftBCount++;
        else if (assigned === 'Shift C') shiftCCount++;
        
        if (d % 7 === 0 && assigned !== 'Off' && assigned !== 'Leave' && assigned !== 'Holiday') {
          hasOverride = true;
        }
      }
      
      let predominantShift = 'Off';
      if (shiftACount > shiftBCount && shiftACount > shiftCCount) predominantShift = 'Shift A';
      else if (shiftBCount > shiftACount && shiftBCount > shiftCCount) predominantShift = 'Shift B';
      else if (shiftCCount > shiftACount && shiftCCount > shiftBCount) predominantShift = 'Shift C';
      else {
        if (empId === '1' || empId === '3' || empId === '6') predominantShift = 'Shift A';
        else if (empId === '2' || empId === '5') predominantShift = 'Shift B';
        else predominantShift = 'Shift C';
      }
      
      let timeLabel = 'Rest Days Block';
      if (predominantShift === 'Shift A') timeLabel = '06:00 AM - 02:00 PM';
      else if (predominantShift === 'Shift B') timeLabel = '02:00 PM - 10:00 PM';
      else if (predominantShift === 'Shift C') timeLabel = '10:00 PM - 06:00 AM';
      
      if (empId === '1' && w.name === 'Week 3') {
        predominantShift = 'Shift B';
        timeLabel = '02:00 PM - 10:00 PM';
        hasOverride = true;
      }
      
      const pad = (n: number) => String(n).padStart(2, '0');
      journey.push({
        weekName: w.name,
        rangeLabel: `${pad(w.start)} ${monthLabel} - ${pad(w.end)} ${monthLabel}`,
        shiftCode: predominantShift,
        timeLabel,
        hasOverride
      });
    });
    
    return journey;
  }

  // Safely gets assignment for day to avoid index-signature template warnings
  getAssignmentForDay(empId: string, dateStr: string): string {
    if (!this.shiftAssignments[empId]) return 'Off';
    return this.shiftAssignments[empId][dateStr] || 'Off';
  }

  // Calculates the weekly breakdown of shift assignments for an employee
  getWeeklyBreakdown(empId: string): { shiftACount: number, shiftBCount: number, shiftCCount: number, offCount: number } {
    let shiftACount = 0;
    let shiftBCount = 0;
    let shiftCCount = 0;
    let offCount = 0;
    this.activeWeekDays.forEach(day => {
      const shift = this.shiftAssignments[empId]?.[day.dateStr] || 'Off';
      if (shift === 'Shift A') shiftACount++;
      else if (shift === 'Shift B') shiftBCount++;
      else if (shift === 'Shift C') shiftCCount++;
      else offCount++;
    });
    return { shiftACount, shiftBCount, shiftCCount, offCount };
  }

  // Shift color code badge finder
  getShiftBadgeClass(empId: string, dateStr: string): string {
    const shiftCode = this.shiftAssignments[empId]?.[dateStr] || 'Off';
    const matched = this.shifts.find(s => s.code === shiftCode);
    return matched ? matched.badgeClass : 'shift-off-badge';
  }

  getShiftTimeLabel(empId: string, dateStr: string): string {
    const shiftCode = this.shiftAssignments[empId]?.[dateStr] || 'Off';
    const matched = this.shifts.find(s => s.code === shiftCode);
    return matched ? matched.time : 'Rest Day';
  }

  // Setup reactive form
  initOverrideForm() {
    this.overrideForm = this.formBuilder.group({
      type: ['change', Validators.required],
      dateStr: ['', Validators.required],
      employeeId: ['', Validators.required],
      newShift: ['Shift A'],
      swapEmployeeId: [''],
      standbyEmployeeId: ['']
    });

    // Update validators on type changes
    this.overrideForm.get('type')?.valueChanges.subscribe(type => {
      const newShiftCtrl = this.overrideForm.get('newShift');
      const swapEmpCtrl = this.overrideForm.get('swapEmployeeId');
      const standbyEmpCtrl = this.overrideForm.get('standbyEmployeeId');

      if (type === 'change') {
        newShiftCtrl?.setValidators([Validators.required]);
        swapEmpCtrl?.clearValidators();
        standbyEmpCtrl?.clearValidators();
      } else if (type === 'swap') {
        newShiftCtrl?.clearValidators();
        swapEmpCtrl?.setValidators([Validators.required]);
        standbyEmpCtrl?.clearValidators();
      } else if (type === 'standby') {
        newShiftCtrl?.clearValidators();
        swapEmpCtrl?.clearValidators();
        standbyEmpCtrl?.setValidators([Validators.required]);
      }

      newShiftCtrl?.updateValueAndValidity();
      swapEmpCtrl?.updateValueAndValidity();
      standbyEmpCtrl?.updateValueAndValidity();
    });
  }

  openOverrideModal(type: 'change' | 'swap' | 'standby', empId?: string, dateStr?: string) {
    this.overrideForm.reset({
      type: type,
      dateStr: dateStr || (this.activeWeekDays[0] ? this.activeWeekDays[0].dateStr : ''),
      employeeId: empId || '',
      newShift: 'Shift A',
      swapEmployeeId: '',
      standbyEmployeeId: ''
    });
    this.isOverrideModalOpen = true;
  }

  closeModal() {
    this.isOverrideModalOpen = false;
  }

  // Apply override from modal
  applyOverride() {
    if (this.overrideForm.invalid) {
      this.overrideForm.markAllAsTouched();
      this.notificationService.show('Please fill in all required fields.', 'error', 3000);
      return;
    }

    const { type, dateStr, employeeId, newShift, swapEmployeeId, standbyEmployeeId } = this.overrideForm.value;
    const emp1 = this.employees.find(e => e.id === employeeId);

    if (type === 'change') {
      const oldShift = this.shiftAssignments[employeeId]?.[dateStr] || 'Off';
      if (oldShift === newShift) {
        this.notificationService.show('Employee is already assigned to this shift on selected date.', 'error', 3000);
        return;
      }

      this.shiftAssignments[employeeId][dateStr] = newShift;

      this.rotationLogs.unshift({
        id: Math.floor(1000 + Math.random() * 9000).toString(),
        timestamp: new Date(),
        type: 'Shift Override',
        description: `Manually changed ${emp1?.name}'s shift on ${dateStr} from ${oldShift} to ${newShift}.`,
        supervisor: 'Supervisor Admin'
      });

      this.notificationService.show('Shift updated successfully!', 'success', 3000);
      this.closeModal();

    } else if (type === 'swap') {
      if (employeeId === swapEmployeeId) {
        this.notificationService.show('Cannot swap shift with the same employee.', 'error', 3000);
        return;
      }

      const emp2 = this.employees.find(e => e.id === swapEmployeeId);
      const shift1 = this.shiftAssignments[employeeId]?.[dateStr] || 'Off';
      const shift2 = this.shiftAssignments[swapEmployeeId]?.[dateStr] || 'Off';

      if (shift1 === shift2) {
        this.notificationService.show(`Both employees are already on the same shift (${shift1}) on this day.`, 'error', 3000);
        return;
      }

      // Perform Swap
      this.shiftAssignments[employeeId][dateStr] = shift2;
      this.shiftAssignments[swapEmployeeId][dateStr] = shift1;

      this.rotationLogs.unshift({
        id: Math.floor(1000 + Math.random() * 9000).toString(),
        timestamp: new Date(),
        type: 'Shift Swap',
        description: `Swapped shifts on ${dateStr} between ${emp1?.name} (${shift1}) and ${emp2?.name} (${shift2}).`,
        supervisor: 'Supervisor Admin'
      });

      this.notificationService.show('Shifts swapped successfully!', 'success', 3000);
      this.closeModal();

    } else if (type === 'standby') {
      if (employeeId === standbyEmployeeId) {
        this.notificationService.show('Original employee and standby employee must be different.', 'error', 3000);
        return;
      }

      const standbyEmp = this.employees.find(e => e.id === standbyEmployeeId);
      const originalShift = this.shiftAssignments[employeeId]?.[dateStr] || 'Off';

      if (originalShift === 'Off') {
        this.notificationService.show('Original employee is already off. No active shift to stand by for.', 'error', 3000);
        return;
      }

      const standbyCurrentShift = this.shiftAssignments[standbyEmployeeId]?.[dateStr] || 'Off';
      if (standbyCurrentShift !== 'Off') {
        this.notificationService.show(`Standby employee ${standbyEmp?.name} is already working on ${dateStr} (${standbyCurrentShift}) and cannot stand by.`, 'error', 4000);
        return;
      }

      // Perform Standby Override
      this.shiftAssignments[employeeId][dateStr] = 'Off'; // Original employee gets Off
      this.shiftAssignments[standbyEmployeeId][dateStr] = originalShift; // Standby employee takes the shift

      this.rotationLogs.unshift({
        id: Math.floor(1000 + Math.random() * 9000).toString(),
        timestamp: new Date(),
        type: 'Standby Assignment',
        description: `Assigned standby ${standbyEmp?.name} to replace ${emp1?.name} for ${originalShift} on ${dateStr}.`,
        supervisor: 'Supervisor Admin'
      });

      this.notificationService.show('Standby shift assigned successfully!', 'success', 3000);
      this.closeModal();
    }
  }

  // Scheduler Rotation Simulation (Sunday 00:00 batch run)
  simulateSchedulerRun() {
    const currentMonday = new Date(this.currentDate);
    const nextMonday = new Date(currentMonday);
    nextMonday.setDate(currentMonday.getDate() + 7);
    const nextMondayStr = this.formatDateStr(nextMonday);

    // Run rotation mapping on each employee
    this.employees.forEach(emp => {
      if (!this.shiftAssignments[emp.id]) {
        this.shiftAssignments[emp.id] = {};
      }

      for (let i = 0; i < 7; i++) {
        // Current day of active week
        const curDay = new Date(currentMonday);
        curDay.setDate(currentMonday.getDate() + i);
        const curDayStr = this.formatDateStr(curDay);

        // Next week corresponding day
        const nextDay = new Date(nextMonday);
        nextDay.setDate(nextMonday.getDate() + i);
        const nextDayStr = this.formatDateStr(nextDay);

        const currentShift = this.shiftAssignments[emp.id][curDayStr] || 'Off';
        let rotatedShift = 'Off';

        if (currentShift === 'Shift A') {
          rotatedShift = 'Shift C';
        } else if (currentShift === 'Shift B') {
          rotatedShift = 'Shift A';
        } else if (currentShift === 'Shift C') {
          rotatedShift = 'Shift B';
        } else {
          rotatedShift = 'Off'; // Off days remain Off
        }

        this.shiftAssignments[emp.id][nextDayStr] = rotatedShift;
      }
    });

    const nextEndDay = new Date(nextMonday);
    nextEndDay.setDate(nextMonday.getDate() + 6);

    // Log Batch Entry
    this.rotationLogs.unshift({
      id: Math.floor(1000 + Math.random() * 9000).toString(),
      timestamp: new Date(),
      type: 'Auto-Rotation',
      description: `Scheduler auto-rotated employee shifts for week (${nextMondayStr} to ${this.formatDateStr(nextEndDay)}) using formula: A->C, B->A, C->B.`,
      supervisor: 'System Scheduler'
    });

    // Move date forward to show the newly generated week
    this.currentDate = nextMonday;
    this.generateActiveWeekDays(this.currentDate);
    this.initRosterForWeek(this.currentDate);

    this.notificationService.show("Sunday 00:00 Scheduler simulated! Roster rotated and advanced.", 'success', 4000);
  }

  initBulkRotateForm() {
    this.bulkRotateForm = this.formBuilder.group({
      sourceGroup: ['', Validators.required],
      targetShift: ['', Validators.required],
      effectiveDate: ['', Validators.required]
    });
  }

  loadShiftGroups() {
    this.shiftService.getShiftGroups().subscribe({
      next: (res: any) => {
        if (res.status === 200 && res.data) {
          this.shiftGroups = res.data;
        }
      },
      error: (err) => console.error('Error loading shift groups in Roster', err)
    });
  }

  openBulkRotationModal() {
    this.loadShiftGroups();
    const today = new Date().toISOString().split('T')[0];
    this.bulkRotateForm.reset({
      sourceGroup: '',
      targetShift: 'Shift A',
      effectiveDate: today
    });
    this.isBulkRotateModalOpen = true;
  }

  closeBulkRotationModal() {
    this.isBulkRotateModalOpen = false;
  }

  applyBulkRotation() {
    if (this.bulkRotateForm.invalid) {
      this.bulkRotateForm.markAllAsTouched();
      this.notificationService.show('Please fill in all required fields.', 'error', 3000);
      return;
    }

    const { sourceGroup, targetShift, effectiveDate } = this.bulkRotateForm.value;

    if (sourceGroup === targetShift) {
      this.notificationService.show('Source group and target shift cannot be the same.', 'error', 3000);
      return;
    }

    const payload = {
      source_group: sourceGroup,
      target_shift: targetShift,
      date: effectiveDate
    };

    this.shiftService.rotateBulkGroup(payload).subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.notificationService.show(res.message || 'Group rotated successfully', 'success', 3000);
          this.initRosterForWeek(this.currentDate); // Refresh grid
          this.loadShiftGroups(); // Refresh count
          
          this.rotationLogs.unshift({
            id: Math.floor(1000 + Math.random() * 9000).toString(),
            timestamp: new Date(),
            type: 'Shift Override',
            description: `Bulk rotated dynamic tag cohort "${sourceGroup}" to "${targetShift}" effective ${effectiveDate}.`,
            supervisor: 'Supervisor Admin'
          });

          this.closeBulkRotationModal();
        } else {
          this.notificationService.show(res.message || 'Rotation failed', 'error', 3000);
        }
      },
      error: (err: any) => {
        console.error('Rotation failed', err);
        this.notificationService.show('An error occurred during bulk rotation.', 'error', 3000);
      }
    });
  }
}
