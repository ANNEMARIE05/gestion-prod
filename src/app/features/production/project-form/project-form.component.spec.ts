import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ProjectFormComponent } from './project-form.component';
import { SettingsService } from '../../../services/settings.service';

describe('ProjectFormComponent', () => {
  let component: ProjectFormComponent;
  let fixture: ComponentFixture<ProjectFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectFormComponent],
      providers: [
        SettingsService,
        { provide: MAT_DIALOG_DATA, useValue: { type: 'PROJECT' } },
        {
          provide: MatDialogRef,
          useValue: { close: (): void => undefined, disableClose: false },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
