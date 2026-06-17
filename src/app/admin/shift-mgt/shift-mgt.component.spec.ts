import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShiftMgtComponent } from './shift-mgt.component';

describe('ShiftMgtComponent', () => {
  let component: ShiftMgtComponent;
  let fixture: ComponentFixture<ShiftMgtComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ShiftMgtComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShiftMgtComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
