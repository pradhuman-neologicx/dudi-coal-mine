import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmployeeService } from 'src/app/core/services/Employee.service';
import { JwtService } from 'src/app/core/services/jwt.service';
import { LoginService } from 'src/app/core/services/login.service';
import { NotificationService } from 'src/app/core/services/notificationnew.service';
import { DepartmentService } from 'src/app/core/services/department.service';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgxPaginationModule } from 'ngx-pagination';

@Component({
  selector: 'app-department',
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
  templateUrl: './department.component.html',
  styleUrl: './department.component.scss',
  animations: [
    trigger('succesfullyMesaage', [
      state(
        'void',
        style({
          transform: 'translateX(-30%)',
          opacity: 0,
        }),
      ),
      transition(':enter, :leave', [
        animate('0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55)'),
      ]),
    ]),
    trigger('slideIn', [
      state(
        'void',
        style({
          transform: 'translateX(100%)',
          opacity: 0,
        }),
      ),
      transition(':enter', [
        animate(
          '0.5s ease-out',
          style({
            transform: 'translateX(0)', // Final position for slide-in effect
            opacity: 1, // Final opacity
          }),
        ),
      ]),
    ]),

    trigger('fadeIn', [
      state(
        'void',
        style({
          opacity: 0,
          transform: 'scale(0.5)', // Start with smaller size
        }),
      ),
      transition(':enter', [
        animate(
          '0.5s ease-out',
          style({
            opacity: 1,
            transform: 'scale(1)', // Final size
          }),
        ),
      ]),
    ]),
  ],
})
export class DepartmentComponent {
  showreset: boolean = false; // Reintroduced for reset button visibility
  searchbarform!: FormGroup;
  createDepartmentForm!: FormGroup;
  updateDepartmentForm!: FormGroup;
  viewDepartmentForm!: FormGroup;
  tableSize: any = 10;
  tableSizes: any = [10, 20, 50, 100, 'all'];
  totalRecords: any;
  page: number = 1;
  createDepartmentOpen: boolean = false;
  updateDepartmentOpen: boolean = false;
  viewDepartmentOpen: boolean = false;
  selectedDepartment: any = null;

  onTableSizeChange(event: any): void {
    this.tableSize = event.target.value;
    this.page = 1;
    this.GetDepartmentFun();
  }

  constructor(
    private formBuilder: FormBuilder,
    private employeeService: EmployeeService,
    private jwtService: JwtService,
    private notificationService: NotificationService,
    private loginService: LoginService,
    private departmentService: DepartmentService,
  ) {}

  searchfun() {
    if (this.searchbarform.valid) {
      this.showreset = true; // Show reset button when search is performed
      this.GetDepartmentFun();
    } else {
      this.searchbarform.markAllAsTouched();
    }
  }

  resetsearchbar() {
    this.searchbarform.get('searchbar')?.reset(); // Clear the search input
    this.showreset = false; // Hide reset button
    this.page = 1; // Reset to first page
    this.GetDepartmentFun(); // Reload data without search
  }
  uuserId: any;
  ngOnInit(): void {
    this.uuserId = this.jwtService.getpanelUserId();
    this.searchbarform = this.formBuilder.group({
      searchbar: ['', [Validators.required]],
    });

    this.createDepartmentForm = this.formBuilder.group({
      Name: ['', [Validators.required]],
    });

    this.updateDepartmentForm = this.formBuilder.group({
      Name: ['', [Validators.required]],
    });

    this.viewDepartmentForm = this.formBuilder.group({
      Name: [''],
    });
    this.GetDepartmentFun();
  }

  departmentList: any;
  table_heading = [
    {
      heading0: 'Serial No.',
      heading1: 'Name',
      heading2: 'Status',
      heading3: 'Action',
    },
  ];

  currentDepartmentId: any;

  OpenEditModal(user: any): void {
    this.currentDepartmentId = user.id;
    this.updateDepartmentOpen = true;
    // this.updateDepartmentForm.patchValue({ Name: user.name });
    this.GetupdateDepartmentbyid(this.currentDepartmentId);
  }

  openviewModal(user: any): void {
    this.viewDepartmentOpen = true;
    this.currentDepartmentId = user.id;
    this.selectedDepartment = null;

    this.departmentService.getDepartmentById(user.id).subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          const dept = response.data;
          this.selectedDepartment = {
            ...dept,
            is_active: dept.status !== undefined ? dept.status : dept.is_active
          };
          this.viewDepartmentForm.patchValue({ Name: dept.name });
        }
      },
      error: (error: any) => {
        console.error('Error fetching department details:', error);
      }
    });
  }


  GetupdateDepartmentbyid(userId: any) {
    this.departmentService.getDepartmentById(userId).subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          this.fillformdate(response.data);
        }
      },
      error: (error: any) => {
        console.error('Error fetching department details:', error);
      }
    });
  }

  async fillformdate(response: any) {
    this.updateDepartmentForm = this.formBuilder.group({
      Name: [response.name, [Validators.required, Validators.minLength(2)]],
    });
  }
  updateDepartment() {
    if (this.updateDepartmentForm.valid) {
      const name = this.updateDepartmentForm.get('Name')?.value;

      const formData = new FormData();
      formData.append('name', name);
      formData.append('_method', 'PUT');

      this.departmentService.updateDepartment(this.currentDepartmentId, formData).subscribe({
        next: (response: any) => {
          if (response.status === 200 || response.status === 201) {
            this.closeModal();
            this.notificationService.show(response.message || 'Department updated successfully', 'success', 3000);
            this.ngOnInit();
          } else {
            this.notificationService.show(
              response.message || response.error || 'Something went wrong',
              'error',
              3000,
            );
          }
        },
        error: (error: any) => {
          console.error('Update Department failed:', error);
          let errorMsg = '';
          if (typeof error === 'string') {
            errorMsg = error.includes('Message:') ? error.split('Message:')[1].trim() : error;
          } else {
            errorMsg = error.message || error.error?.message || 'Something went wrong';
          }
          this.notificationService.show(errorMsg, 'error', 3000);
        }
      });
    } else {
      this.updateDepartmentForm.markAllAsTouched();
    }
  }

  onTableDataChange(event: any) {
    this.page = event;
    this.GetDepartmentFun();
  }

  closeModal() {
    this.updateDepartmentOpen = false;
    this.createDepartmentOpen = false;
    this.viewDepartmentOpen = false;
    this.selectedDepartment = null;
    this.createDepartmentForm.reset();
  }

  openAddModal() {
    this.createDepartmentOpen = true;
  }
  errorMessage: any;
  createDepartment() {
    if (this.createDepartmentForm.valid) {
      const name = this.createDepartmentForm.get('Name')?.value;

      const formData = new FormData();
      formData.append('name', name);

      this.departmentService.createDepartment(formData).subscribe({
        next: (response: any) => {
          if (response.status === 200 || response.status === 201) {
            this.closeModal();
            this.notificationService.show(response.message || 'Department created successfully', 'success', 3000);
            this.ngOnInit();
          } else {
            this.notificationService.show(
              response.message || response.error || 'Something went wrong',
              'error',
              3000,
            );
          }
        },
        error: (error) => {
          console.error('Create Department failed:', error);
          let errorMsg = '';
          if (typeof error === 'string') {
            errorMsg = error.includes('Message:') ? error.split('Message:')[1].trim() : error;
          } else {
            errorMsg = error.message || error.error?.message || 'Something went wrong';
          }
          this.errorMessage = errorMsg; // Display error message
          this.notificationService.show(this.errorMessage, 'error', 3000);
        },
      });
    } else {
      this.createDepartmentForm.markAllAsTouched();
    }
  }

  GetDepartmentFun() {
    const searchText = this.searchbarform?.get('searchbar')?.value || '';

    this.departmentService
      .getDepartments(this.tableSize, this.page, searchText)
      .subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            this.departmentList = response.data.map((item: any) => ({
              ...item,
              is_active: item.status !== undefined ? item.status : item.is_active
            }));
            this.totalRecords = response.pagination?.total || response.data.length;
          } else {
            console.error('Failed to fetch departments:', response.message);
          }
        },
        error: (error: any) => {
          console.error('Error fetching departments:', error);
        }
      });
  }

  async Status(id: string, status: any) {
    const department = this.departmentList?.find((d: any) => d.id === id);
    if (!department) return;

    const formData = new FormData();
    formData.append('_method', 'PATCH');
    formData.append('status', status.toString());

    this.departmentService.updateDepartmentStatus(id, formData).subscribe({
      next: (response: any) => {
        if (response.status === 200 || response.status === 201) {
          this.notificationService.show(
            response.message || `Department status updated successfully`,
            'success',
            3000
          );
          this.GetDepartmentFun();
        } else {
          this.notificationService.show(
            response.message || response.error || 'Failed to update status',
            'error',
            3000
          );
        }
      },
      error: (error: any) => {
        console.error('Status update failed:', error);
        let errorMsg = '';
        if (typeof error === 'string') {
          errorMsg = error.includes('Message:') ? error.split('Message:')[1].trim() : error;
        } else {
          errorMsg = error.message || error.error?.message || 'Something went wrong';
        }
        this.notificationService.show(errorMsg, 'error', 3000);
      }
    });
  }
}
