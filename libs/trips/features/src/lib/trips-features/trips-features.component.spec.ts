import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TripsFeaturesComponent } from './trips-features.component';

describe('TripsFeaturesComponent', () => {
  let component: TripsFeaturesComponent;
  let fixture: ComponentFixture<TripsFeaturesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TripsFeaturesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TripsFeaturesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
