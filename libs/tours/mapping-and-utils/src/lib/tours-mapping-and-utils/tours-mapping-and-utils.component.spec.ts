import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToursMappingAndUtilsComponent } from './tours-mapping-and-utils.component';

describe('ToursMappingAndUtilsComponent', () => {
  let component: ToursMappingAndUtilsComponent;
  let fixture: ComponentFixture<ToursMappingAndUtilsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToursMappingAndUtilsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ToursMappingAndUtilsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
