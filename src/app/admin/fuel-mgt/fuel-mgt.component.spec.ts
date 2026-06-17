import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FuelMgtComponent } from './fuel-mgt.component';

describe('FuelMgtComponent', () => {
  let component: FuelMgtComponent;
  let fixture: ComponentFixture<FuelMgtComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FuelMgtComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FuelMgtComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
