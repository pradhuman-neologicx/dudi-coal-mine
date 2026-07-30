import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DumpingComponent } from './dumping.component';

describe('DumpingComponent', () => {
  let component: DumpingComponent;
  let fixture: ComponentFixture<DumpingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DumpingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DumpingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
