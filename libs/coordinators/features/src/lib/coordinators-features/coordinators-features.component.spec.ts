import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CoordinatorsFeaturesComponent } from './coordinators-features.component';

describe('CoordinatorsFeaturesComponent', () => {
  let component: CoordinatorsFeaturesComponent;
  let fixture: ComponentFixture<CoordinatorsFeaturesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoordinatorsFeaturesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CoordinatorsFeaturesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
