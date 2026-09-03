import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SharedModelsComponent } from './shared-models.component';

describe('SharedModelsComponent', () => {
  let component: SharedModelsComponent;
  let fixture: ComponentFixture<SharedModelsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModelsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SharedModelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
