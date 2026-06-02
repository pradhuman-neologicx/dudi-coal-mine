import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NotificationService } from 'src/app/core/services/notificationnew.service';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgxPaginationModule } from 'ngx-pagination';

@Component({
  selector: 'app-designation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    NgxPaginationModule,
  ],
  templateUrl: './designation.component.html',
  styleUrl: './designation.component.scss',
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
  ],
})
export class DesignationComponent implements OnInit {
  showreset: boolean = false;
  searchbarform!: FormGroup;
  tableSize: any = 10;
  tableSizes: any = [10, 20, 50, 100, 'all'];
  totalRecords: any;
  page: number = 1;
  viewDesignationOpen: boolean = false;
  selectedDesignation: any = null;

  mockDesignations: any[] = [
    { id: '1', name: 'Mining Engineer', code: 'MENG', department: 'Mining', created_at: '2023-01-15', is_active: 1 },
    { id: '2', name: 'Safety Officer', code: 'SOFF', department: 'Security', created_at: '2023-03-22', is_active: 1 },
    { id: '3', name: 'Excavator Operator', code: 'EXOP', department: 'Maintenance', created_at: '2023-05-10', is_active: 1 },
    { id: '4', name: 'HR Manager', code: 'HRMG', department: 'HR', created_at: '2023-07-04', is_active: 1 },
    { id: '5', name: 'Ventilation Officer', code: 'VOFF', department: 'Mining', created_at: '2023-09-18', is_active: 0 },
    { id: '6', name: 'Logistics Supervisor', code: 'LSUP', department: 'Operations', created_at: '2023-11-05', is_active: 1 },
    { id: '7', name: 'Blasting Specialist', code: 'BSPL', department: 'Mining', created_at: '2024-01-20', is_active: 1 },
    { id: '8', name: 'Maintenance Technician', code: 'MTEC', department: 'Maintenance', created_at: '2024-02-14', is_active: 0 }
  ];

  designationList: any[] = [];
  table_heading = ['Serial No.', 'Designation Name', 'Status', 'Action'];

  constructor(
    private formBuilder: FormBuilder,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.searchbarform = this.formBuilder.group({
      searchbar: ['', [Validators.required]]
    });
    this.GetDesignationFun();
  }

  onTableSizeChange(event: any): void {
    this.tableSize = event.target.value;
    this.page = 1;
    this.GetDesignationFun();
  }

  onTableDataChange(event: any) {
    this.page = event;
    this.GetDesignationFun();
  }

  searchfun() {
    if (this.searchbarform.valid) {
      this.showreset = true;
      this.GetDesignationFun();
    } else {
      this.searchbarform.markAllAsTouched();
    }
  }

  resetsearchbar() {
    this.searchbarform.get('searchbar')?.reset();
    this.showreset = false;
    this.page = 1;
    this.GetDesignationFun();
  }

  openviewModal(designation: any): void {
    this.selectedDesignation = designation;
    this.viewDesignationOpen = true;
  }

  closeModal() {
    this.viewDesignationOpen = false;
    this.selectedDesignation = null;
  }

  GetDesignationFun() {
    const searchText = this.searchbarform.get('searchbar')?.value?.toLowerCase();
    let filteredData = this.mockDesignations;

    if (searchText) {
      filteredData = this.mockDesignations.filter((d) =>
        d.name.toLowerCase().includes(searchText) || 
        d.code.toLowerCase().includes(searchText) ||
        d.department.toLowerCase().includes(searchText)
      );
    }

    this.totalRecords = filteredData.length;

    if (this.tableSize === 'all') {
      this.designationList = filteredData;
    } else {
      const startIndex = (this.page - 1) * this.tableSize;
      const endIndex = startIndex + this.tableSize;
      this.designationList = filteredData.slice(startIndex, endIndex);
    }
  }

  async Status(id: string, status: any) {
    const index = this.mockDesignations.findIndex((d) => d.id === id);
    if (index !== -1) {
      this.mockDesignations[index].is_active = status;
      this.notificationService.show(
        `Designation ${status ? 'activated' : 'deactivated'} successfully`,
        'success',
        2000
      );
      this.GetDesignationFun();
    }
  }
}
