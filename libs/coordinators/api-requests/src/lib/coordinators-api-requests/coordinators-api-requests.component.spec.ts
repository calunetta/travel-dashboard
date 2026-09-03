import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CoordinatorsApiRequestsComponent } from './coordinators-api-requests.component';

describe('CoordinatorsApiRequestsComponent', () => {
  let component: CoordinatorsApiRequestsComponent;
  let fixture: ComponentFixture<CoordinatorsApiRequestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoordinatorsApiRequestsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CoordinatorsApiRequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
