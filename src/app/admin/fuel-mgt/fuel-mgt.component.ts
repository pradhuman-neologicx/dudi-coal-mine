import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-fuel-mgt',
  templateUrl: './fuel-mgt.component.html',
  styleUrls: ['./fuel-mgt.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule]
})
export class FuelMgtComponent implements OnInit, AfterViewInit {

  isModalOpen = false;
  isEditMode = false;
  isFilterOpen = false;
  isUpdating = false;

  formData: any = {
    date: '',
    shift: '',
    machineId: '',
    opening: 0,
    issued: 0,
    closing: 0,
    consumption: 0,
    bcm: 0,
    efficiency: 0
  };

  topDateRange = 'Last 7 Days';
  topShift = 'All Shifts';
  topLocation = 'All Locations';
  
  selectedMachine = '';
  selectedTrend = '';

  updateDashboard() {
    this.isUpdating = true;
    setTimeout(() => {
      this.isUpdating = false;
      this.initFuelEfficiencyChart();
    }, 800);
  }

  toggleFilter() {
    this.isFilterOpen = !this.isFilterOpen;
  }

  clearFilters() {
    this.selectedMachine = '';
    this.selectedTrend = '';
    setTimeout(() => {
      this.initFuelEfficiencyChart();
    }, 100);
  }

  get filteredFuelData() {
    return this.fuelData.filter(item => {
      const matchMachine = this.selectedMachine ? item.machineDesc.includes(this.selectedMachine) : true;
      const matchTrend = this.selectedTrend ? item.trend === this.selectedTrend : true;
      return matchMachine && matchTrend;
    });
  }

  fuelData = [
    {
      machineId: 'EXC-201',
      machineDesc: 'Komatsu PC1250',
      opening: 1240,
      issued: 850,
      closing: 920,
      consumption: 1170,
      trend: 'up',
      fuelBcm: 0.92,
      efficiencyClass: 'bg-gray-100 text-gray-800'
    },
    {
      machineId: 'DT-104',
      machineDesc: 'CAT 777E',
      opening: 450,
      issued: 400,
      closing: 380,
      consumption: 470,
      trend: 'down',
      fuelBcm: 0.85,
      efficiencyClass: 'bg-green-100 text-green-700'
    },
    {
      machineId: 'DOZ-003',
      machineDesc: 'CAT D11',
      opening: 1800,
      issued: 600,
      closing: 1550,
      consumption: 850,
      trend: 'down',
      fuelBcm: 0.42,
      efficiencyClass: 'bg-gray-100 text-gray-800'
    },
    {
      machineId: 'DT-105',
      machineDesc: 'CAT 777E',
      opening: 320,
      issued: 500,
      closing: 290,
      consumption: 530,
      trend: 'up',
      fuelBcm: 1.12,
      efficiencyClass: 'bg-red-100 text-red-700'
    },
    {
      machineId: 'GRD-012',
      machineDesc: 'Komatsu GD825',
      opening: 210,
      issued: 150,
      closing: 240,
      consumption: 120,
      trend: 'neutral',
      fuelBcm: 0.76,
      efficiencyClass: 'bg-gray-100 text-gray-800'
    }
  ];

  constructor() { }

  maxDate: string = '';

  ngOnInit(): void {
    const today = new Date();
    this.maxDate = today.toISOString().split('T')[0];
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initFuelEfficiencyChart();
    }, 100);
  }

  chartInstance: any;

  initFuelEfficiencyChart() {
    const ctx = document.getElementById('fuelEfficiencyChart') as HTMLCanvasElement;
    if (!ctx) return;
    
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const labels = this.filteredFuelData.map(item => item.machineId);
    const data = this.filteredFuelData.map(item => item.fuelBcm);

    this.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Fuel per BCM',
            data: data,
            backgroundColor: '#0f2a4a',
            hoverBackgroundColor: '#0c223c',
            barPercentage: 0.4,
            borderRadius: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `${context.raw} L/BCM`
            }
          }
        },
        scales: {
          x: { 
            grid: { display: false },
            ticks: {
              font: { size: 10 }
            }
          },
          y: { 
            beginAtZero: true,
            max: 1.2,
            ticks: {
              stepSize: 0.3,
              font: { size: 10, style: 'italic' },
              callback: (value) => `${value} L`
            },
            border: { display: false },
            grid: {
              color: '#f3f4f6'
            }
          }
        }
      }
    });
  }

  openModal() {
    this.isEditMode = false;
    this.resetForm();
    this.isModalOpen = true;
  }

  resetForm() {
    this.formData = {
      date: new Date().toISOString().split('T')[0],
      shift: 'Shift A (06:00 - 14:00)',
      machineId: '',
      opening: 0,
      issued: 0,
      closing: 0,
      consumption: 0,
      bcm: 0,
      efficiency: 0
    };
  }

  openEditModal(item: any) {
    this.isEditMode = true;
    this.formData = {
      date: new Date().toISOString().split('T')[0], // placeholder date
      shift: 'Shift B (14:00 - 22:00)', // placeholder shift
      machineId: item.machineId,
      opening: item.opening,
      issued: item.issued,
      closing: item.closing,
      consumption: item.consumption,
      bcm: item.fuelBcm ? (item.consumption / item.fuelBcm).toFixed(0) : 0, // derived BCM
      efficiency: item.fuelBcm
    };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.isEditMode = false;
    this.resetForm();
  }

  saveLog() {
    if (this.isEditMode) {
      console.log('Update API called for:', this.formData);
      // TODO: Call update API
    } else {
      console.log('Create API called for:', this.formData);
      // TODO: Call create API
    }
    this.closeModal();
  }

}
