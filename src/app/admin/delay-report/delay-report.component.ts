import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxPrintModule } from 'ngx-print';
import { NgxPaginationModule } from 'ngx-pagination';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

interface DelayLog {
  shift: string;
  delayType: string;
  hoursLost: number;
  remarks: string;
  status: string;
}

@Component({
  selector: 'app-delay-report',
  templateUrl: './delay-report.component.html',
  styleUrls: ['./delay-report.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule, NgxPrintModule, NgxPaginationModule]
})
export class DelayReportComponent implements OnInit {

  isModalOpen = false;
  isFilterOpen = false;
  filterStatus = '';
  filterDelayType = '';

  delayLogs: DelayLog[] = [
    { shift: 'Shift B', delayType: 'Mechanical Failure', hoursLost: 2.45, remarks: 'Excavator EX-104 hydraulic hose burst.', status: 'CRITICAL' },
    { shift: 'Shift B', delayType: 'Blasting Clearance', hoursLost: 1.15, remarks: 'Scheduled blasting at Bench 4. All fleet evacuated.', status: 'PLANNED' },
    { shift: 'Shift B', delayType: 'Wait for Dump', hoursLost: 0.85, remarks: 'Congestion at OB-Waste Dump 2 due to grader work.', status: 'MONITOR' },
    { shift: 'Shift B', delayType: 'Operator Changeover', hoursLost: 0.50, remarks: 'Scheduled mid-shift break and hot-seat swap.', status: 'NORMAL' },
    { shift: 'Shift B', delayType: 'Refuelling', hoursLost: 1.20, remarks: 'Bulk refuelling for Fleet Unit Alpha-02.', status: 'ROUTINE' }
  ];

  filteredLogs: DelayLog[] = [];

  // Filter state
  selectedShiftFilter = 'Shift: B (Current)';
  shiftFilters = [
    { label: 'Shift: A (Day)', value: 'Shift: A (Day)' },
    { label: 'Shift: B (Current)', value: 'Shift: B (Current)' },
    { label: 'Shift: C (Night)', value: 'Shift: C (Night)' }
  ];

  // Modal State
  selectedShift = null;
  shifts = [
    { label: 'Shift A', value: 'Shift A' },
    { label: 'Shift B', value: 'Shift B' },
    { label: 'Shift C', value: 'Shift C' }
  ];
  totalWorkingHours = 8.0;
  selectedDelayType = '';
  timeLost = '';
  remark = '';
  chart: any;
  editingIndex: number = -1;
  p: number = 1;

  ngOnInit() {
    this.filteredLogs = [...this.delayLogs];
    setTimeout(() => {
      this.createChart();
    }, 100);
  }

  createChart() {
    const ctx = document.getElementById('delayChart') as HTMLCanvasElement;
    if (!ctx) return;
    
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Fuel', 'Blasting', 'Breakdown', 'Changeover', 'Congest', 'Safety'],
        datasets: [{
          label: 'Delay Hours',
          data: [2, 4, 7, 3, 1.5, 1],
          backgroundColor: [
            '#8fa4af',
            '#8fa4af',
            '#e88d8d',
            '#8fa4af',
            '#8fa4af',
            '#8fa4af'
          ],
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            display: false,
            beginAtZero: true
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 10
              },
              color: function(context: any) {
                return context.tick.label === 'Breakdown' ? '#dc2626' : '#6b7280';
              }
            }
          }
        }
      }
    });
  }

  applyFilter() {
    let filtered = this.delayLogs;

    // Shift filter
    if (this.selectedShiftFilter) {
      const filterValue = this.selectedShiftFilter.includes('Shift: A') ? 'Shift A' :
                          this.selectedShiftFilter.includes('Shift: B') ? 'Shift B' :
                          this.selectedShiftFilter.includes('Shift: C') ? 'Shift C' : '';
      if (filterValue) {
        filtered = filtered.filter(log => log.shift === filterValue);
      }
    }

    // Status filter
    if (this.filterStatus) {
      filtered = filtered.filter(log => log.status === this.filterStatus);
    }

    // Delay Type filter
    if (this.filterDelayType) {
      filtered = filtered.filter(log => log.delayType.toLowerCase().includes(this.filterDelayType.toLowerCase()));
    }

    this.filteredLogs = [...filtered];
  }

  clearFilters() {
    this.filterStatus = '';
    this.filterDelayType = '';
    this.selectedShiftFilter = 'Shift: B (Current)';
    this.applyFilter();
  }

  openModal(log?: DelayLog, index?: number) {
    if (log && index !== undefined) {
      this.editingIndex = index;
      this.selectedShift = log.shift as any;
      this.selectedDelayType = log.delayType;
      // Convert hours to HH:MM roughly
      const totalMins = Math.round(log.hoursLost * 60);
      const hh = Math.floor(totalMins / 60).toString().padStart(2, '0');
      const mm = (totalMins % 60).toString().padStart(2, '0');
      this.timeLost = `${hh}:${mm}`;
      this.remark = log.remarks;
    } else {
      this.resetModal();
    }
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.resetModal();
  }

  resetModal() {
    this.editingIndex = -1;
    this.selectedShift = null;
    this.totalWorkingHours = 8.0;
    this.selectedDelayType = '';
    this.timeLost = '';
    this.remark = '';
  }

  saveDelay() {
    if (this.selectedShift && this.selectedDelayType && this.timeLost) {
      let hrs = 0;
      if (this.timeLost.includes(':')) {
        const [hh, mm] = this.timeLost.split(':');
        hrs = parseInt(hh, 10) + (parseInt(mm, 10) / 60);
      } else {
        hrs = parseFloat(this.timeLost);
      }
      
      const newLog: DelayLog = {
        shift: this.selectedShift,
        delayType: this.selectedDelayType,
        hoursLost: parseFloat(hrs.toFixed(2)),
        remarks: this.remark,
        status: 'MONITOR'
      };

      if (this.editingIndex > -1) {
        // Keep the original status if editing, or just update it
        newLog.status = this.delayLogs[this.editingIndex].status;
        this.delayLogs[this.editingIndex] = newLog;
      } else {
        this.delayLogs.unshift(newLog);
      }
      this.applyFilter();
    }
    this.closeModal();
  }
}
