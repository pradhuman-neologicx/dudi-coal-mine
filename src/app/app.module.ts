import { NgModule } from '@angular/core';
import { HomeComponent } from './website/home/home.component';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AdminComponent } from './admin/admin.component';
import { SidenavComponent } from './admin/sidenav/sidenav.component';
import { SidenavHeaderComponent } from './admin/sidenav-header/sidenav-header.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from './mat/mat.module';
import { MatMenuModule } from '@angular/material/menu';
import { DatePipe } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { LoadingInterceptor } from './core/services/loading.interceptor';
import { LoginpagesComponent } from './admin/loginpages/loginpages.component';
import { ForgotPasswordComponent } from './admin/loginpages/forgot-password/forgot-password.component';
import { ApiService } from './core/services/api.service';
import { DataService } from './core/services/data.service';
import { JwtService } from './core/services/jwt.service';
import { SigninComponent } from './admin/loginpages/signin/signin.component';
import { OtpComponent } from './admin/loginpages/otp/otp.component';
import { SpinnerComponent } from './spinner/spinner.component';
import { EmployeeService } from './core/services/Employee.service';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
import { NavbarComponent } from './website/navbar/navbar.component';
import { EmployeePayrollComponent } from './admin/employee-payroll/employee-payroll.component';
import { IncidentTypeComponent } from './admin/masters/incident-type/incident-type.component';
import { SeverityLevelComponent } from './admin/masters/severity-level/severity-level.component';



@NgModule({
  declarations: [
    AppComponent,
    AdminComponent,
    SidenavComponent,
    SidenavHeaderComponent,
    LoginpagesComponent,
    ForgotPasswordComponent,
    SigninComponent,
    OtpComponent,
    SpinnerComponent,
    HomeComponent,
    NavbarComponent,
    EmployeePayrollComponent,
    IncidentTypeComponent,
    SeverityLevelComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    HttpClientModule,
    NgSelectModule,
    MatMenuModule,
    NgxPaginationModule,
  ],
  providers: [
    DataService,
    ApiService,
    JwtService,
    DatePipe,
    EmployeeService,
    { provide: HTTP_INTERCEPTORS, useClass: LoadingInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
