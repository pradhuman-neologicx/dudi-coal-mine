import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BreakdownTypeComponent } from './breakdown-type.component';

describe('BreakdownTypeComponent', () => {
  let component: BreakdownTypeComponent;
  let fixture: ComponentFixture<BreakdownTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BreakdownTypeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BreakdownTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
