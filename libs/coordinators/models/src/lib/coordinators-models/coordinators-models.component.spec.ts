import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CoordinatorsModelsComponent } from './coordinators-models.component';

describe('CoordinatorsModelsComponent', () => {
  let component: CoordinatorsModelsComponent;
  let fixture: ComponentFixture<CoordinatorsModelsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoordinatorsModelsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CoordinatorsModelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
