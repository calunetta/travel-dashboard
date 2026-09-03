import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TripsModelsComponent } from './trips-models.component';

describe('TripsModelsComponent', () => {
  let component: TripsModelsComponent;
  let fixture: ComponentFixture<TripsModelsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TripsModelsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TripsModelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
