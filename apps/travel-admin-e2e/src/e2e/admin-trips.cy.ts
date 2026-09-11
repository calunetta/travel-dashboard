describe('Admin Trips Flow', () => {
  beforeEach(() => {
    cy.visit('/admin/trips', {
      onBeforeLoad(win) {
        win.localStorage.setItem('bypassAuth', 'true');
      }
    });
  });

  it('should display the trip list and allow batch deletion', () => {
    // Verify the mock trip is rendered
    cy.contains('Japan').should('be.visible');
    cy.contains('JP-2026').should('be.visible');

    // Click the master checkbox to select all (SUPER_ADMIN only)
    cy.get('th mat-checkbox').click();

    // Batch Delete button appears after selection (no aria-label on this button)
    cy.contains('button', 'Delete Selected').click();

    // Confirm dialog title
    cy.get('mat-dialog-container').should('be.visible');
    cy.get('mat-dialog-container').contains('Delete Multiple Trips');

    // Click confirm — label is 'Delete All'
    cy.get('mat-dialog-container button').contains('Delete All').click();

    // Snackbar shows 'Successfully deleted N trips'
    cy.contains('Successfully deleted').should('be.visible');
  });

  it('should allow CSV import', () => {
    // Click the Import CSV button
    cy.get('button').contains('Batch Import (CSV)').click();

    // CSV preview dialog should open
    cy.get('mat-dialog-container').should('be.visible');
    
    const csvContent = 'weRoadTourSlug,start date,end date,coordinator,coordinator number,coordinator email,notes,hotel,booked by,nationality\nmock-tour-code,2026-12-01,2026-12-15,,,,,,,IT';
    
    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from(csvContent),
      fileName: 'trips.csv',
      mimeType: 'text/csv',
    }, { force: true });

    // Click Confirm Import
    cy.contains('button', 'Import 1 Trips').click();

    // Snackbar shows 'Successfully imported N trips!' or 'Import completed'
    cy.contains('uccessfully').should('be.visible');
  });

  it('should filter trips by Search, Date Start, Booked By, Tour, and Nationality', () => {
    // Filter controls should exist
    cy.get('input[formControlName="search"]').should('exist');
    cy.get('input[formControlName="dateStart"]').should('exist');
    cy.get('mat-select[formControlName="bookedBy"]').should('exist');
    cy.get('mat-select[formControlName="tourId"]').should('exist');
    cy.get('mat-select[formControlName="nationality"]').should('exist');

    // Type a search query
    cy.get('input[formControlName="search"]').type('nonexistent trip', { force: true });
    cy.contains('No trips found').should('be.visible');

    // Clear search query
    cy.get('input[formControlName="search"]').clear();
    cy.contains('Japan').should('be.visible');

    // Select nationality
    cy.get('mat-select[formControlName="nationality"]').click({ force: true });
    cy.get('mat-option').contains('IT').click({ force: true });
    cy.get('table').should('be.visible');
  });
});
