import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SafetyManagementComponent } from './safety-management.component';

describe('SafetyManagementComponent', () => {
  let component: SafetyManagementComponent;
  let fixture: ComponentFixture<SafetyManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SafetyManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SafetyManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
