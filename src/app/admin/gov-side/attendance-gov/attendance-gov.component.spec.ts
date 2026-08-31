import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceGovComponent } from './attendance-gov.component';

describe('AttendanceGovComponent', () => {
  let component: AttendanceGovComponent;
  let fixture: ComponentFixture<AttendanceGovComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AttendanceGovComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AttendanceGovComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
