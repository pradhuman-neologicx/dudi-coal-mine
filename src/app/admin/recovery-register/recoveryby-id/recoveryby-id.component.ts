import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

import { EmployeeManagementService } from 'src/app/core/services/employee-management.service';

@Component({
  selector: 'app-recoveryby-id',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxPaginationModule, NgSelectModule, RouterModule],
  templateUrl: './recoveryby-id.component.html',
  styleUrls: ['./recoveryby-id.component.scss']
})
export class RecoverybyIdComponent implements OnInit {
  tableSizes: number[] = [10, 20, 50, 100];
  
  overviewP: number = 1;
  overviewShowEntries: number = 10;
  
  overviewSearchTerm: string = '';
  selectedRecoveryType: string = 'All';
  selectedShowCause: string = 'All';
  selectedStatus: string = 'All';

  viewDetailsOpen: boolean = false;
  viewingRecord: any = null;
  monthId: string | null = null;
  isLoading: boolean = false;
  
  selectedMonthDetails: any = {
    month: 'N/A',
    year: '2026',
    totalAmount: 0,
    totalPenalties: 0,
    status: 'Active'
  };

  recoveryRecords: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private employeeManagementService: EmployeeManagementService
  ) { }

  ngOnInit(): void {
    this.monthId = this.route.snapshot.paramMap.get('id');
    if (this.monthId) {
      this.loadReportDetails(this.monthId);
    }
  }

  loadReportDetails(id: string): void {
    this.isLoading = true;
    this.employeeManagementService.getRecoveryReportDetails(id, this.overviewP, this.overviewShowEntries, this.overviewSearchTerm).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res && (res.status === 200 || res.status === 201) && res.data) {
          const data = res.data;
          this.selectedMonthDetails = {
            month: data.month || 'N/A',
            year: data.year || new Date().getFullYear(),
            totalAmount: data.total_amount || data.total_recovered_amount || 0,
            totalPenalties: data.total_penalties || data.total_rows || 0,
            status: data.status || 'Active'
          };
          const rows = Array.isArray(data) ? data : (data.records || data.rows || data.items || []);
          this.recoveryRecords = rows.map((r: any, idx: number) => ({
            id: r.id || idx + 1,
            name: r.name || r.employee_name || 'N/A',
            recoveryType: r.recovery_type || r.recoveryType || 'Damage',
            particulars: r.particulars || r.reason || '',
            dateOfDamageLoss: r.date_of_damage_loss || r.dateOfDamageLoss || '',
            amount: r.amount || 0,
            showCauseIssued: r.show_cause_issued === 1 || r.show_cause_issued === '1' || r.show_cause_issued === 'Yes' ? 'Yes' : 'No',
            witnessName: r.witness_name || r.witnessName || '',
            installments: r.installments || 1,
            firstMonth: r.first_month || r.firstMonth || '',
            lastMonth: r.last_month || r.lastMonth || '',
            dateOfCompleteRecovery: r.date_of_complete_recovery || r.dateOfCompleteRecovery || '',
            remarks: r.remarks || ''
          }));
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error('Failed to load recovery report details:', err);
      }
    });
  }

  get filteredRecoveryRecords(): any[] {
    return this.recoveryRecords.filter(rec => {
      const matchesSearch = !this.overviewSearchTerm || 
        rec.name?.toLowerCase().includes(this.overviewSearchTerm.toLowerCase()) ||
        rec.particulars?.toLowerCase().includes(this.overviewSearchTerm.toLowerCase());
      
      const matchesType = this.selectedRecoveryType === 'All' || rec.recoveryType === this.selectedRecoveryType;
      const matchesShowCause = this.selectedShowCause === 'All' || rec.showCauseIssued === this.selectedShowCause;

      let matchesStatus = true;
      if (this.selectedStatus === 'Completed') {
        matchesStatus = !!rec.dateOfCompleteRecovery;
      } else if (this.selectedStatus === 'In Progress') {
        matchesStatus = !rec.dateOfCompleteRecovery;
      }

      return matchesSearch && matchesType && matchesShowCause && matchesStatus;
    });
  }

  onOverviewPageChange(event: any): void {
    this.overviewP = event;
    if (this.monthId) {
      this.loadReportDetails(this.monthId);
    }
  }

  onOverviewShowEntriesChange(): void {
    this.overviewP = 1;
    if (this.monthId) {
      this.loadReportDetails(this.monthId);
    }
  }

  openViewDetails(rec: any) {
    this.viewingRecord = rec;
    this.viewDetailsOpen = true;
  }

  closeViewDetails() {
    this.viewDetailsOpen = false;
    this.viewingRecord = null;
  }
  
  goBack() {
    this.router.navigate(['/admin/recovery-register']);
  }
}
