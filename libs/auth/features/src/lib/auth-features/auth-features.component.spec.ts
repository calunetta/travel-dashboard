import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthFeaturesComponent } from './auth-features.component';

describe('AuthFeaturesComponent', () => {
  let component: AuthFeaturesComponent;
  let fixture: ComponentFixture<AuthFeaturesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthFeaturesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthFeaturesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
