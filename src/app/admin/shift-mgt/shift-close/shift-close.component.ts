import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ShiftPlanningService } from '../../../core/services/shift-planning.service';
import { NotificationService } from '../../../core/services/notificationnew.service';

@Component({
  selector: 'app-shift-close',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shift-close.component.html',
  styleUrl: './shift-close.component.scss'
})
export class ShiftCloseComponent implements OnInit {

  shiftClosure = {
    attendanceSubmitted: false,
    fuelLogsAvailable: false,
    delayLogsUpdated: false,
    breakdownLogsUpdated: false,
    productionDataAvailable: false,
    safetyDataReviewed: false,
    shiftRemarks: '',
    handoverNotes: ''
  };

  closureSummaryData: any = null;
  loading: boolean = true;
  showConfirmModal: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private shiftPlanningService: ShiftPlanningService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.fetchSummary(id);
    } else {
      this.loading = false;
    }
  }

  fetchSummary(id: string) {
    this.loading = true;
    this.shiftPlanningService.getShiftClosureSummary(id).subscribe({
      next: (res) => {
        if (res.status === 200 && res.data) {
          this.closureSummaryData = res.data;

          if (this.closureSummaryData.validation_checklist) {
            const checks = this.closureSummaryData.validation_checklist;
            this.shiftClosure.attendanceSubmitted = checks.attendance_submitted;
            this.shiftClosure.fuelLogsAvailable = checks.fuel_logs_completed;
            this.shiftClosure.delayLogsUpdated = checks.delay_records_updated;
            this.shiftClosure.breakdownLogsUpdated = checks.breakdown_records_updated;
            this.shiftClosure.productionDataAvailable = checks.production_data_available;
            this.shiftClosure.safetyDataReviewed = checks.safety_records_reviewed;
          }
        } else if (res.status !== 200) {
          this.notificationService.show(res.message || 'Failed to fetch summary data', 'error');
          this.router.navigate(['/admin/shift-mgt']);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching shift closure summary:', err);
        const errorMsg = err?.message || 'Failed to fetch shift closure summary';
        this.notificationService.show(errorMsg, 'error');
        this.loading = false;
        this.router.navigate(['/admin/shift-mgt']);
      }
    });
  }

  submitShiftClosure() {
    this.showConfirmModal = true;
  }

  confirmClosure() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    const formData = new FormData();
    formData.append('supervisor_remarks', this.shiftClosure.shiftRemarks);
    formData.append('handover_notes', this.shiftClosure.handoverNotes);
    formData.append('closure_confirmed', '1');
    formData.append('attendance_submitted', String(this.shiftClosure.attendanceSubmitted));
    formData.append('fuel_logs_available', String(this.shiftClosure.fuelLogsAvailable));
    formData.append('delay_logs_updated', String(this.shiftClosure.delayLogsUpdated));
    formData.append('breakdown_logs_updated', String(this.shiftClosure.breakdownLogsUpdated));
    formData.append('production_data_available', String(this.shiftClosure.productionDataAvailable));
    formData.append('safety_data_reviewed', String(this.shiftClosure.safetyDataReviewed));

    this.shiftPlanningService.closeShiftPlan(id, formData).subscribe({
      next: (res) => {
        // Assume success if it reaches here
        this.showConfirmModal = false;
        this.notificationService.show(res.message, 'success');
        this.router.navigate(['/admin/shift-mgt']);
      },
      error: (err) => {
        console.error('Error closing shift:', err);
        const errorMsg = err.error?.message || 'Failed to close shift';

        this.showConfirmModal = false;
      }
    });
  }

  cancelClosure() {
    this.showConfirmModal = false;
  }

  goBack() {
    this.router.navigate(['/admin/shift-mgt']);
  }
}
