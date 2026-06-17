import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BreakdownAndMaintenanceComponent } from './breakdown-and-maintenance.component';

describe('BreakdownAndMaintenanceComponent', () => {
  let component: BreakdownAndMaintenanceComponent;
  let fixture: ComponentFixture<BreakdownAndMaintenanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BreakdownAndMaintenanceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BreakdownAndMaintenanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
