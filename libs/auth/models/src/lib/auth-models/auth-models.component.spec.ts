import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthModelsComponent } from './auth-models.component';

describe('AuthModelsComponent', () => {
  let component: AuthModelsComponent;
  let fixture: ComponentFixture<AuthModelsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthModelsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthModelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
