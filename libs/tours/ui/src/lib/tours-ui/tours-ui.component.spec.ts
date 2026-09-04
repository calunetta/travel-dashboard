import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToursUiComponent } from './tours-ui.component';

describe('ToursUiComponent', () => {
  let component: ToursUiComponent;
  let fixture: ComponentFixture<ToursUiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToursUiComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ToursUiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
