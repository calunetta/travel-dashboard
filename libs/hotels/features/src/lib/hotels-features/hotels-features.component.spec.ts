import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HotelsFeaturesComponent } from './hotels-features.component';

describe('HotelsFeaturesComponent', () => {
  let component: HotelsFeaturesComponent;
  let fixture: ComponentFixture<HotelsFeaturesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelsFeaturesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HotelsFeaturesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
