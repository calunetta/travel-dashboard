import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CoordinatorsMappingAndUtilsComponent } from './coordinators-mapping-and-utils.component';

describe('CoordinatorsMappingAndUtilsComponent', () => {
  let component: CoordinatorsMappingAndUtilsComponent;
  let fixture: ComponentFixture<CoordinatorsMappingAndUtilsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoordinatorsMappingAndUtilsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CoordinatorsMappingAndUtilsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
