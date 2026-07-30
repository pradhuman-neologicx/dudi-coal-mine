import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DelayTypeComponent } from './delay-type.component';

describe('DelayTypeComponent', () => {
  let component: DelayTypeComponent;
  let fixture: ComponentFixture<DelayTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DelayTypeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DelayTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
