import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CoordinatorsUiComponent } from './coordinators-ui.component';

describe('CoordinatorsUiComponent', () => {
  let component: CoordinatorsUiComponent;
  let fixture: ComponentFixture<CoordinatorsUiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoordinatorsUiComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CoordinatorsUiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
