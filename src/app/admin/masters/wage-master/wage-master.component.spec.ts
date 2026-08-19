import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WageMasterComponent } from './wage-master.component';

describe('WageMasterComponent', () => {
  let component: WageMasterComponent;
  let fixture: ComponentFixture<WageMasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WageMasterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WageMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
