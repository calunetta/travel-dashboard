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
    cy.get('snack-bar-container').should('contain', 'Successfully deleted');
  });

  it('should allow CSV import', () => {
    // Click the Import CSV button
    cy.get('button').contains('Batch Import (CSV)').click();

    // CSV preview dialog should open
    cy.get('mat-dialog-container').should('be.visible');
    
    const csvContent = 'weRoadTourSlug,start date,end date,coordinator,coordinator number,coordinator email,notes,hotel,booked by,nationality\nmock-tour-code,2026-12-01,2026-12-15,,,,,,IT';
    
    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from(csvContent),
      fileName: 'trips.csv',
      mimeType: 'text/csv',
    }, { force: true });

    // Click Confirm Import
    cy.contains('button', 'Import 1 Trips').click();

    // Snackbar shows 'Successfully imported N trips!' or 'Import completed'
    cy.get('snack-bar-container').should('contain', 'uccessfully');
  });
});
