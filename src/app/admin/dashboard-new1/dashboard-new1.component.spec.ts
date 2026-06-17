import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardNew1Component } from './dashboard-new1.component';

describe('DashboardNew1Component', () => {
  let component: DashboardNew1Component;
  let fixture: ComponentFixture<DashboardNew1Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DashboardNew1Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardNew1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
