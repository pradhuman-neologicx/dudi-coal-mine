import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EquipmentMasterComponent } from './equipment-master.component';

describe('EquipmentMasterComponent', () => {
  let component: EquipmentMasterComponent;
  let fixture: ComponentFixture<EquipmentMasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EquipmentMasterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EquipmentMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
