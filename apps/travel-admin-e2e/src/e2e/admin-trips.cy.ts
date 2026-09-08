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

    // Click the master checkbox to select all
    cy.get('th mat-checkbox').click();

    // Batch Delete button should appear
    cy.get('button[aria-label="Delete selected"]').click();

    // Confirm dialog should appear
    cy.get('mat-dialog-container').should('be.visible');
    cy.get('mat-dialog-container').contains('Confirm Deletion');
    
    // Click confirm
    cy.get('mat-dialog-container button').contains('Delete').click();

    // Wait for delete snackbar (avoiding explicit cy.wait on mock intercepts for timing)
    cy.get('snack-bar-container').should('contain', 'deleted successfully');
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

    // Should contain successfully
    cy.get('snack-bar-container').should('contain', 'successfully');
  });
});
