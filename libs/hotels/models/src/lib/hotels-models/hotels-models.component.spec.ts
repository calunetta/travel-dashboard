import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HotelsModelsComponent } from './hotels-models.component';

describe('HotelsModelsComponent', () => {
  let component: HotelsModelsComponent;
  let fixture: ComponentFixture<HotelsModelsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelsModelsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HotelsModelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
