import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToursApiRequestsComponent } from './tours-api-requests.component';

describe('ToursApiRequestsComponent', () => {
  let component: ToursApiRequestsComponent;
  let fixture: ComponentFixture<ToursApiRequestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToursApiRequestsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ToursApiRequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
