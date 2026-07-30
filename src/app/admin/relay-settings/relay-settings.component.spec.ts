import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelaySettingsComponent } from './relay-settings.component';

describe('RelaySettingsComponent', () => {
  let component: RelaySettingsComponent;
  let fixture: ComponentFixture<RelaySettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RelaySettingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RelaySettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
