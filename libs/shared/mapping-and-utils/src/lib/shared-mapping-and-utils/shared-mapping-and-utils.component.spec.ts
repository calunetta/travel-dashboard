import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SharedMappingAndUtilsComponent } from './shared-mapping-and-utils.component';

describe('SharedMappingAndUtilsComponent', () => {
  let component: SharedMappingAndUtilsComponent;
  let fixture: ComponentFixture<SharedMappingAndUtilsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedMappingAndUtilsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SharedMappingAndUtilsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
