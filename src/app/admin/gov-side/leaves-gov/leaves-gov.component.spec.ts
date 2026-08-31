import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeavesGovComponent } from './leaves-gov.component';

describe('LeavesGovComponent', () => {
  let component: LeavesGovComponent;
  let fixture: ComponentFixture<LeavesGovComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LeavesGovComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeavesGovComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
