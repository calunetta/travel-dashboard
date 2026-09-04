import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToursFeaturesComponent } from './tours-features.component';

describe('ToursFeaturesComponent', () => {
  let component: ToursFeaturesComponent;
  let fixture: ComponentFixture<ToursFeaturesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToursFeaturesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ToursFeaturesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
