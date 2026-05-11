import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { AuditTrailComponent } from './audit-trail.component';

describe('AuditTrailComponent', () => {
  let component: AuditTrailComponent;
  let fixture: ComponentFixture<AuditTrailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditTrailComponent],
      providers: [provideNoopAnimations()],
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AuditTrailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
