import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TripsUiComponent } from './trips-ui.component';

describe('TripsUiComponent', () => {
  let component: TripsUiComponent;
  let fixture: ComponentFixture<TripsUiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TripsUiComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TripsUiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
