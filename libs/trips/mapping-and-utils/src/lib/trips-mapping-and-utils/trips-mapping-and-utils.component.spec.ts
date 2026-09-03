import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TripsMappingAndUtilsComponent } from './trips-mapping-and-utils.component';

describe('TripsMappingAndUtilsComponent', () => {
  let component: TripsMappingAndUtilsComponent;
  let fixture: ComponentFixture<TripsMappingAndUtilsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TripsMappingAndUtilsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TripsMappingAndUtilsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
