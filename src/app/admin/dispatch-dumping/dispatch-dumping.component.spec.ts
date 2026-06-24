import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DispatchDumpingComponent } from './dispatch-dumping.component';

describe('DispatchDumpingComponent', () => {
  let component: DispatchDumpingComponent;
  let fixture: ComponentFixture<DispatchDumpingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DispatchDumpingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DispatchDumpingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
