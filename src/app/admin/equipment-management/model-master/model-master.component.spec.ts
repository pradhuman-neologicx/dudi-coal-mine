import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelMasterComponent } from './model-master.component';

describe('ModelMasterComponent', () => {
  let component: ModelMasterComponent;
  let fixture: ComponentFixture<ModelMasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModelMasterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModelMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
