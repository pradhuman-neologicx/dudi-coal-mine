import { HomeComponent } from './website/home/home.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './admin/admin.component';
import { ForgotPasswordComponent } from './admin/loginpages/forgot-password/forgot-password.component';
import { SigninComponent } from './admin/loginpages/signin/signin.component';
import { LoginpagesComponent } from './admin/loginpages/loginpages.component';
import { OtpComponent } from './admin/loginpages/otp/otp.component';
import { DashboardComponent } from './admin/dashboard/dashboard.component';
import { StaffComponent } from './admin/user-management/staff/staff.component';
import { ViewProfileComponent } from './admin/user-management/view-profile/view-profile.component';
import { AuthGuard } from './core/auth/auth-guard';
import { UserManagementComponent } from './admin/user-management/user-management.component';
import { MastersComponent } from './admin/masters/masters.component';
import { DepartmentComponent } from './admin/masters/department/department.component';
import { DesignationComponent } from './admin/masters/designation/designation.component';
import { SiteMasterComponent } from './admin/masters/site-master/site-master.component';
import { ShiftComponent } from './admin/masters/shift/shift.component';
import { LeaveTypeComponent } from './admin/masters/leave-type/leave-type.component';
import { SalaryStructureComponent } from './admin/masters/salary-structure/salary-structure.component';
import { HolidayComponent } from './admin/masters/holiday/holiday.component';
import { EmployeeManagementComponent } from './admin/employee-management/employee-management.component';
import { EmployeePayrollComponent } from './admin/employee-payroll/employee-payroll.component';
import { ShiftManagementComponent } from './admin/shift-management/shift-management.component';
import { AttendanceManagementComponent } from './admin/attendance-management/attendance-management.component';
import { LeaveManagementComponent } from './admin/leave-management/leave-management.component';
import { PayrollManagementComponent } from './admin/payroll-management/payroll-management.component';

import { EquipmentManagementComponent } from './admin/equipment-management/equipment-management.component';
import { EquipmentCategoryComponent } from './admin/masters/equipment-category/equipment-category.component';
import { TrainingTypeComponent } from './admin/masters/training-type/training-type.component';
import { TrainingManagementComponent } from './admin/training-management/training-management.component';
import { CategoriesComponent } from './admin/inventory-management/categories/categories.component';
import { ProductMasterComponent } from './admin/inventory-management/product-master/product-master.component';
import { InventoryComponent } from './admin/inventory-management/inventory/inventory.component';
import { VehicleManagementComponent } from './admin/vehicle-management/vehicle-management.component';
import { VehicleMasterComponent } from './admin/vehicle-management/vehicle-master/vehicle-master.component';
import { VehiclesComponent } from './admin/vehicle-management/vehicles/vehicles.component';
import { FuelComponent } from './admin/fuel/fuel.component';
import { FuelStationsComponent } from './admin/fuel/fuel-stations/fuel-stations.component';
import { FuelManagementComponent } from './admin/fuel/fuel-management/fuel-management.component';
import { AttendanceDetailComponent } from './admin/attendance-management/attendance-detail/attendance-detail.component';
import { DashboardNewComponent } from './admin/dashboard-new/dashboard-new.component';
import { DelayReportComponent } from './admin/delay-report/delay-report.component';
import { FuelMgtComponent } from './admin/fuel-mgt/fuel-mgt.component';
import { DashboardNew1Component } from './admin/dashboard-new1/dashboard-new1.component';
import { IncidentTypeComponent } from './admin/masters/incident-type/incident-type.component';
import { SeverityLevelComponent } from './admin/masters/severity-level/severity-level.component';
import { BreakdownTypeComponent } from './admin/masters/breakdown-type/breakdown-type.component';

const routes: Routes = [
  {
    path: 'home',
    component: HomeComponent,
  },
  {
    path: '',

    component: LoginpagesComponent,
    children: [
      { path: '', redirectTo: 'sign_in', pathMatch: 'full' },
      { path: 'sign_in', component: SigninComponent },
      { path: 'reset-password/:id/:token', component: OtpComponent },
      { path: 'forgot_password', component: ForgotPasswordComponent },
    ],
  },
  {
    path: 'admin',

    component: AdminComponent,
    children: [
      { path: '', redirectTo: 'DashboardComponent', pathMatch: 'full' },
      {
        path: 'dashboard',
        component: DashboardNewComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'dashboard2',
        component: DashboardNew1Component,
        canActivate: [AuthGuard],
      },

      {
        path: 'user-management',

        component: UserManagementComponent,
        canActivate: [AuthGuard],
        children: [
          { path: '', redirectTo: 'staff', pathMatch: 'full' },
          {
            path: 'staff',
            component: StaffComponent,
          },
          {
            path: 'view-profile/:id',
            component: ViewProfileComponent,
          },
        ],
      },
      {
        path: 'employee-management',
        component: EmployeeManagementComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'employee-payroll',
        component: EmployeePayrollComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'shift-management',
        component: ShiftManagementComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'attendance-management',
        canActivate: [AuthGuard],
        children: [
          { path: '', component: AttendanceManagementComponent },
          {
            path: 'attendance-detail/:id',
            component: AttendanceDetailComponent,
          },
        ],
      },
      {
        path: 'leave-management',
        component: LeaveManagementComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'payroll-management',
        component: PayrollManagementComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'equipment-management',
        component: EquipmentManagementComponent,
        canActivate: [AuthGuard],
        children: [
          { path: '', redirectTo: 'equipment-master', pathMatch: 'full' },
          { path: 'equipment-master', loadComponent: () => import('./admin/equipment-management/equipment-master/equipment-master.component').then(m => m.EquipmentMasterComponent) },
          { path: 'equipments', loadComponent: () => import('./admin/equipment-management/equipments/equipments.component').then(m => m.EquipmentsComponent) }
        ]
      },
      {
        path: 'inventory-management/categories',
        component: CategoriesComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'inventory-management/product-master',
        component: ProductMasterComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'inventory-management/inventory',
        component: InventoryComponent,
        canActivate: [AuthGuard],
      },

      {
        path: 'master',
        component: MastersComponent,
        canActivate: [AuthGuard],
        children: [
          { path: '', redirectTo: 'department', pathMatch: 'full' },
          {
            path: 'department',
            component: DepartmentComponent,
          },
          {
            path: 'designation',
            component: DesignationComponent,
          },
          {
            path: 'site',
            component: SiteMasterComponent,
          },
          {
            path: 'shift',
            component: ShiftComponent,
          },
          {
            path: 'leave-type',
            component: LeaveTypeComponent,
          },
          {
            path: 'salary-structure',
            component: SalaryStructureComponent,
          },
          {
            path: 'holiday',
            component: HolidayComponent,
          },

          {
            path: 'equipment-category',
            component: EquipmentCategoryComponent,
          },
          {
            path: 'training-type',
            component: TrainingTypeComponent,
          },
          {
            path: 'incident-type',
            component: IncidentTypeComponent,
          },
          {
            path: 'breakdown-type',
            component: BreakdownTypeComponent,
          },
          {
            path: 'severity-level',
            component: SeverityLevelComponent,
          },
        ],
      },
      {
        path: 'training-management',
        component: TrainingManagementComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'breakdown-and-maintenance',
        loadComponent: () => import('./admin/breakdown-and-maintenance/breakdown-and-maintenance.component').then(m => m.BreakdownAndMaintenanceComponent),
        canActivate: [AuthGuard],
      },
      {
        path: 'breakdown-and-maintenance/report',
        loadComponent: () => import('./admin/breakdown-and-maintenance/report/report.component').then(m => m.ReportComponent),
        canActivate: [AuthGuard],
      },
      {
        path: 'fuel-mgt',
        component: FuelMgtComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'fuel-mgt/report',
        component: FuelMgtComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'delay-report',
        component: DelayReportComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'shift-mgt',
        loadComponent: () => import('./admin/shift-mgt/shift-mgt.component').then(m => m.ShiftMgtComponent),
        canActivate: [AuthGuard],
      },
      {
        path: 'shift-mgt/add',
        loadComponent: () => import('./admin/shift-mgt/shift-add/shift-add.component').then(m => m.ShiftAddComponent),
        canActivate: [AuthGuard],
      },
      {
        path: 'shift-mgt/edit/:id',
        loadComponent: () => import('./admin/shift-mgt/shift-add/shift-add.component').then(m => m.ShiftAddComponent),
        canActivate: [AuthGuard],
      },
      {
        path: 'shift-mgt/summary/:id',
        loadComponent: () => import('./admin/shift-mgt/shift-summery/shift-summery.component').then(m => m.ShiftSummeryComponent),
        canActivate: [AuthGuard],
      },
      {
        path: 'safety-management',
        loadComponent: () => import('./admin/safety-management/safety-management.component').then(m => m.SafetyManagementComponent),
        canActivate: [AuthGuard],
      },
      {
        path: 'safety-management/report',
        loadComponent: () => import('./admin/safety-management/report/report.component').then(m => m.ReportComponent),
        canActivate: [AuthGuard],
      },
      {
        path: 'dispatch-dumping',
        loadComponent: () => import('./admin/dispatch-dumping/dispatch-dumping.component').then(m => m.DispatchDumpingComponent),
        canActivate: [AuthGuard],
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          { path: 'dashboard', loadComponent: () => import('./admin/dispatch-dumping/dashboard/dashboard.component').then(m => m.DashboardComponent) },
          { path: 'register', loadComponent: () => import('./admin/dispatch-dumping/register/register.component').then(m => m.RegisterComponent) },
          { path: 'fleet-performance', loadComponent: () => import('./admin/dispatch-dumping/fleet-performance/fleet-performance.component').then(m => m.FleetPerformanceComponent) }
        ]
      },
      {
        path: 'fuel',
        component: FuelComponent,
        canActivate: [AuthGuard],
        children: [
          { path: '', redirectTo: 'fuel-stations', pathMatch: 'full' },
          {
            path: 'fuel-stations',
            component: FuelStationsComponent,
          },
          {
            path: 'fuel-management',
            component: FuelManagementComponent,
          },
        ],
      },
      {
        path: 'vehicle-management',
        component: VehicleManagementComponent,
        canActivate: [AuthGuard],
        children: [
          { path: '', redirectTo: 'vehicle-master', pathMatch: 'full' },
          {
            path: 'vehicle-master',
            component: VehicleMasterComponent,
          },
          {
            path: 'vehicles',
            component: VehiclesComponent,
          },
          // {
          //   path: 'driver-mapping',
          //   component: VehicleMapingComponent,
          // },
        ],
      },


    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
