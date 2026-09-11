import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HotelFormComponent } from './hotel-form.component';
import { provideRouter } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HotelApiService } from 'hotels-api-requests';
import { TourApiService } from 'tours-api-requests';
import { FirebaseAuthService } from 'auth-api-requests';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CountryCode } from 'hotels-models';
import type { FirestoreId } from 'shared-models';
import { Nationality } from 'shared-models';
import type { Tour } from 'tours-models';

const MOCK_TOUR: Tour = {
  id: 'tour-1' as FirestoreId,
  tourName: 'Bali Express',
  tourWeRoadCode: 'BALI',
  country: 'ID',
  tourLength: 8,
  nationalities: [Nationality.IT],
  adminIds: ['admin-uid-1' as FirestoreId],
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

describe('HotelFormComponent', () => {
  let component: HotelFormComponent;
  let fixture: ComponentFixture<HotelFormComponent>;
  let mockHotelApi: jest.Mocked<Pick<HotelApiService, 'getById$' | 'create' | 'update'>>;
  let mockTourApi: jest.Mocked<Pick<TourApiService, 'getAll$'>>;
  let mockAuthService: jest.Mocked<Pick<FirebaseAuthService, 'currentUser' | 'isSuperAdmin'>>;

  const buildValidBillingData = () => ({
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
    swiftCode: 'TESTIT12',
  });

  beforeEach(async () => {
    Object.defineProperty(globalThis, 'crypto', {
      value: { randomUUID: () => 'test-uuid-1234' },
      configurable: true,
    });

    mockHotelApi = {
      getById$: jest.fn().mockReturnValue(of(null)),
      create: jest.fn().mockResolvedValue('new-hotel-id' as FirestoreId),
      update: jest.fn().mockResolvedValue(undefined),
    };

    mockTourApi = {
      getAll$: jest.fn().mockReturnValue(of([MOCK_TOUR])),
    };

    // Angular Signals cannot be mocked with jest.fn(); we use signal() to
    // satisfy the type system.
    const currentUserSignal = signal<{ uid: string } | null>({ uid: 'admin-uid-1' });
    const isSuperAdminSignal = signal<boolean>(false);

    mockAuthService = {
      currentUser: currentUserSignal,
      isSuperAdmin: isSuperAdminSignal,
    } as unknown as jest.Mocked<Pick<FirebaseAuthService, 'currentUser' | 'isSuperAdmin'>>;

    await TestBed.configureTestingModule({
      imports: [
        HotelFormComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatSnackBarModule,
      ],
      providers: [
        provideRouter([]),
        { provide: HotelApiService, useValue: mockHotelApi },
        { provide: TourApiService, useValue: mockTourApi },
        { provide: FirebaseAuthService, useValue: mockAuthService },
      ],
    })
    .overrideComponent(HotelFormComponent, {
      remove: { imports: [MatSnackBarModule] },
      add: { providers: [{ provide: MatSnackBar, useValue: { open: jest.fn() } }] }
    })
    .compileComponents();

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

  it('should allow optional billing data', () => {
    const billingGroup = component.form.get('billingData');
    expect(billingGroup?.invalid).toBe(false);

    billingGroup?.patchValue(buildValidBillingData());

    expect(billingGroup?.invalid).toBe(false);
  });

  it('should add a new pricing range', () => {
    const initialLength = component.pricingRanges.length;
    component.addPricingRange();
    expect(component.pricingRanges.length).toBe(initialLength + 1);
  });

  it('should remove a pricing range', () => {
    component.addPricingRange();
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
      toDate: new Date(),
    });

    expect(firstRange.invalid).toBe(false);
  });

  /**
   * REGRESSION TEST — Bug Fix: Strict Hotel creation adminIds.
   *
   * Symptom: Fallback logic allowed hotels to be created with only the creator's UID,
   * isolating other tour admins.
   *
   * Fix: Rely strictly on `toursCache` (populated synchronously via `shareReplay`).
   * If the tour is not in cache, throw an error.
   */
  it('[REGRESSION] should strictly use adminIds from toursCache and throw if missing', async () => {
    // Arrange: valid form data
    component.form.patchValue({
      tourId: 'tour-1' as FirestoreId,
      name: 'Grand Resort',
      destination: 'Bali',
      notes: '',
      billingData: buildValidBillingData(),
    });

    // 1. Success case: tour is in cache
    component.toursCache = [MOCK_TOUR];
    await component.onSubmit();
    
    expect(mockHotelApi.create).toHaveBeenCalledTimes(1);
    const callArg = (mockHotelApi.create as jest.Mock).mock.calls[0][0];
    expect(callArg.adminIds).toEqual(['admin-uid-1']); // Matches MOCK_TOUR.adminIds

    // 2. Error case: tour is missing from cache (e.g. invalid tourId)
    component.toursCache = []; // simulate missing tour
    component.form.patchValue({ tourId: 'invalid-tour-id' as FirestoreId });
    
    // We expect the catch block to be hit and a snackbar to be shown.
    // However, the error is caught inside onSubmit and logged/snackbarred.
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn());
    await component.onSubmit();
    
    expect(consoleSpy).toHaveBeenCalledWith('Failed to save hotel', expect.any(Error));
    expect(consoleSpy.mock.calls[0][1].message).toBe('Selected tour not found in cache. Cannot assign adminIds securely.');
    
    consoleSpy.mockRestore();
  });
});
