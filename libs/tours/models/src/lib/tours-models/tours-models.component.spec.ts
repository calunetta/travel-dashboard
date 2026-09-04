import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToursModelsComponent } from './tours-models.component';

describe('ToursModelsComponent', () => {
  let component: ToursModelsComponent;
  let fixture: ComponentFixture<ToursModelsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToursModelsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ToursModelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
