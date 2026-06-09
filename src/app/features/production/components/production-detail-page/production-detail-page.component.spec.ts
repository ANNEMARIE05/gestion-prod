import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductionDetailPageComponent } from './production-detail-page.component';

describe('ProductionDetailPageComponent', () => {
  let component: ProductionDetailPageComponent;
  let fixture: ComponentFixture<ProductionDetailPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductionDetailPageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProductionDetailPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
