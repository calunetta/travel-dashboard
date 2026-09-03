import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HotelsApiRequestsComponent } from './hotels-api-requests.component';

describe('HotelsApiRequestsComponent', () => {
  let component: HotelsApiRequestsComponent;
  let fixture: ComponentFixture<HotelsApiRequestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelsApiRequestsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HotelsApiRequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
