import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeverityLevelComponent } from './severity-level.component';

describe('SeverityLevelComponent', () => {
  let component: SeverityLevelComponent;
  let fixture: ComponentFixture<SeverityLevelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SeverityLevelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeverityLevelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
