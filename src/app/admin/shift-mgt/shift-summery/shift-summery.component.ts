import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ShiftPlanningService } from 'src/app/core/services/shift-planning.service';

@Component({
  selector: 'app-shift-summery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shift-summery.component.html',
  styleUrls: ['./shift-summery.component.scss']
})
export class ShiftSummeryComponent implements OnInit {

  selectedShift: any = {
    date: '',
    shiftCode: '',
    status: ''
  };

  summaryData: any = null;
  loading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private shiftPlanningService: ShiftPlanningService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.selectedShift.shiftCode = id;
      this.fetchSummary(id);
    }
  }

  fetchSummary(id: string) {
    this.loading = true;
    this.shiftPlanningService.getShiftSummary(id).subscribe({
      next: (res: any) => {
        if (res && res.status === 200) {
          this.summaryData = res.data;
          if (this.summaryData.shift_plan) {
            this.selectedShift.date = this.summaryData.shift_plan.planning_date;
            this.selectedShift.status = this.summaryData.shift_plan.status.toUpperCase();
            this.selectedShift.shiftCode = this.summaryData.shift_plan.shift?.shift_name || this.summaryData.shift_plan.shift_id;
          }
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching shift summary', err);
        this.loading = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/admin/shift-mgt']);
  }
}
