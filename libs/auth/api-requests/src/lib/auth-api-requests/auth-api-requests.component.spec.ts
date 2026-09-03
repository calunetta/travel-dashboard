import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthApiRequestsComponent } from './auth-api-requests.component';

describe('AuthApiRequestsComponent', () => {
  let component: AuthApiRequestsComponent;
  let fixture: ComponentFixture<AuthApiRequestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthApiRequestsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthApiRequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
