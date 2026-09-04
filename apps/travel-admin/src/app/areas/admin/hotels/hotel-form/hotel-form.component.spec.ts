import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HotelFormComponent } from './hotel-form.component';
import { provideRouter } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HotelApiService } from 'hotels-api-requests';
import { TourApiService } from 'tours-api-requests';
import { of } from 'rxjs';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { CountryCode } from 'hotels-models';

describe('HotelFormComponent', () => {
  let component: HotelFormComponent;
  let fixture: ComponentFixture<HotelFormComponent>;
  let mockHotelApi: any;
  let mockTourApi: any;

  beforeEach(async () => {
    Object.defineProperty(globalThis, 'crypto', {
      value: {
        randomUUID: () => 'test-uuid-1234'
      },
      configurable: true
    });

    mockHotelApi = {
      getById$: jest.fn().mockReturnValue(of(null)),
      create: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
    };

    mockTourApi = {
      getAll$: jest.fn().mockReturnValue(of([])),
    };

    await TestBed.configureTestingModule({
      imports: [
        HotelFormComponent, 
        ReactiveFormsModule, 
        NoopAnimationsModule, 
        MatSnackBarModule
      ],
      providers: [
        provideRouter([]),
        { provide: HotelApiService, useValue: mockHotelApi },
        { provide: TourApiService, useValue: mockTourApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HotelFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize with an invalid form', () => {
    expect(component.form.invalid).toBe(true);
  });

  it('should validate required base fields', () => {
    const nameControl = component.form.get('name');
    const destinationControl = component.form.get('destination');

    expect(nameControl?.hasError('required')).toBe(true);
    expect(destinationControl?.hasError('required')).toBe(true);

    nameControl?.setValue('Test Hotel');
    destinationControl?.setValue('Rome');

    expect(nameControl?.hasError('required')).toBe(false);
    expect(destinationControl?.hasError('required')).toBe(false);
  });

  it('should validate billing data required fields', () => {
    const billingGroup = component.form.get('billingData');
    expect(billingGroup?.invalid).toBe(true);

    billingGroup?.patchValue({
      supplierName: 'Test Hotel SRL',
      taxCode: '12345678901',
      address: 'Via Roma 1',
      city: 'Rome',
      postalCode: '00100',
      country: CountryCode.IT,
      beneficiary: 'Test Beneficiary',
      phone: '',
      email: 'test@example.com',
      accountNumber: 'IT123456789',
      swiftCode: 'TESTIT12'
    });

    expect(billingGroup?.invalid).toBe(false);
  });

  it('should add a new pricing range', () => {
    const initialLength = component.pricingRanges.length;
    component.addPricingRange();
    expect(component.pricingRanges.length).toBe(initialLength + 1);
  });

  it('should remove a pricing range', () => {
    component.addPricingRange(); // Ensure at least one exists
    const lengthBeforeRemoval = component.pricingRanges.length;
    
    component.removePricingRange(0);
    expect(component.pricingRanges.length).toBe(lengthBeforeRemoval - 1);
  });

  it('should validate pricing range required fields', () => {
    component.addPricingRange();
    const firstRange = component.pricingRanges.at(0);
    
    expect(firstRange.invalid).toBe(true);

    firstRange.patchValue({
      label: 'Summer Rate',
      fromDate: new Date(),
      toDate: new Date()
    });

    expect(firstRange.invalid).toBe(false);
  });
});
