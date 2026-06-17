import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShiftSummeryComponent } from './shift-summery.component';

describe('ShiftSummeryComponent', () => {
  let component: ShiftSummeryComponent;
  let fixture: ComponentFixture<ShiftSummeryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ShiftSummeryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShiftSummeryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
