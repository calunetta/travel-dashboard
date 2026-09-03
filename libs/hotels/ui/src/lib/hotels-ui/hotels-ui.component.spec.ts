import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HotelsUiComponent } from './hotels-ui.component';

describe('HotelsUiComponent', () => {
  let component: HotelsUiComponent;
  let fixture: ComponentFixture<HotelsUiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelsUiComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HotelsUiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
