import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DumpingPointComponent } from './dumping-point.component';

describe('DumpingPointComponent', () => {
  let component: DumpingPointComponent;
  let fixture: ComponentFixture<DumpingPointComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DumpingPointComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DumpingPointComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
