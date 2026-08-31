import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GovSideComponent } from './gov-side.component';

describe('GovSideComponent', () => {
  let component: GovSideComponent;
  let fixture: ComponentFixture<GovSideComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GovSideComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GovSideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
