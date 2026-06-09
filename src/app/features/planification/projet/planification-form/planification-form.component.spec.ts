import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanificationFormComponent } from './planification-form.component';

describe('PlanificationFormComponent', () => {
  let component: PlanificationFormComponent;
  let fixture: ComponentFixture<PlanificationFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanificationFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PlanificationFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
