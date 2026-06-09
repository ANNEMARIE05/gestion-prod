import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductionFormPageComponent } from './production-form-page.component';

describe('ProductionFormPageComponent', () => {
  let component: ProductionFormPageComponent;
  let fixture: ComponentFixture<ProductionFormPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductionFormPageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProductionFormPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
