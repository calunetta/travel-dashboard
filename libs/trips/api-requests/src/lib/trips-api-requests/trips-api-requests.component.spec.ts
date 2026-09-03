import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TripsApiRequestsComponent } from './trips-api-requests.component';

describe('TripsApiRequestsComponent', () => {
  let component: TripsApiRequestsComponent;
  let fixture: ComponentFixture<TripsApiRequestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TripsApiRequestsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TripsApiRequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
