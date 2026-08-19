import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalaryPayrollManagementComponent } from './salary-payroll-management.component';

describe('SalaryPayrollManagementComponent', () => {
  let component: SalaryPayrollManagementComponent;
  let fixture: ComponentFixture<SalaryPayrollManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SalaryPayrollManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalaryPayrollManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
