import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FleetPerformanceComponent } from './fleet-performance.component';

describe('FleetPerformanceComponent', () => {
  let component: FleetPerformanceComponent;
  let fixture: ComponentFixture<FleetPerformanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FleetPerformanceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FleetPerformanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
