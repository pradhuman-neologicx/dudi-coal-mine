import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { NgxPaginationModule } from 'ngx-pagination';
import { EmployeeManagementService } from 'src/app/core/services/employee-management.service';

@Component({
  selector: 'app-employee-details',
  templateUrl: './employee-details.component.html',
  styleUrl: './employee-details.component.scss',
  standalone: true,
  imports: [CommonModule, NgxPaginationModule]
})
export class EmployeeDetailsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  tableSize: any = 10;
  totalRecords: number = 0;
  page: number = 1;
  employeeList: any[] = [];

  constructor(
    private employeeManagementService: EmployeeManagementService
  ) {}

  ngOnInit(): void {
    this.GetEmployeeFun();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  GetEmployeeFun(): void {
    this.employeeManagementService.getEmployeePayrolls(this.tableSize, this.page, '', '', '')
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            const rawList = response.data?.data || response.data || [];
            this.employeeList = rawList.map((emp: any) => {
              let pUrl = emp.photo_url || emp.photo || null;
              if (pUrl === 'null' || pUrl === '') pUrl = null;
              else if (pUrl && !pUrl.startsWith('http')) {
                pUrl = 'https://dudicoalmine.mobilogicx.com/' + pUrl.replace(/^\/+/, '');
              }

              let sUrl = emp.signature_url || emp.signature || null;
              if (sUrl === 'null' || sUrl === '') sUrl = null;
              else if (sUrl && !sUrl.startsWith('http')) {
                sUrl = 'https://dudicoalmine.mobilogicx.com/' + sUrl.replace(/^\/+/, '');
              }

              return {
                ...emp,
                photo_url: pUrl,
                signature_url: sUrl
              };
            });
            this.totalRecords = response.pagination?.total || response.data?.total || this.employeeList.length;
          } else {
            this.employeeList = [];
            this.totalRecords = 0;
          }
        },
        error: (err: any) => {
          console.error('Error fetching employees', err);
          this.employeeList = [];
        }
      });
  }

  onTableDataChange(event: number): void {
    this.page = event;
    this.GetEmployeeFun();
  }
}
