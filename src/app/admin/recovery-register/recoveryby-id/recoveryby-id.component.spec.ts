import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecoverybyIdComponent } from './recoveryby-id.component';

describe('RecoverybyIdComponent', () => {
  let component: RecoverybyIdComponent;
  let fixture: ComponentFixture<RecoverybyIdComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecoverybyIdComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecoverybyIdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
