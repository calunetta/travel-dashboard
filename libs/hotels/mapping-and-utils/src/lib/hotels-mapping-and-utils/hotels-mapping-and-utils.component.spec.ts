import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HotelsMappingAndUtilsComponent } from './hotels-mapping-and-utils.component';

describe('HotelsMappingAndUtilsComponent', () => {
  let component: HotelsMappingAndUtilsComponent;
  let fixture: ComponentFixture<HotelsMappingAndUtilsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelsMappingAndUtilsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HotelsMappingAndUtilsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
