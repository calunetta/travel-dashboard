describe('Admin Hotels Flow', () => {
  beforeEach(() => {
    // Custom command to login as super admin
    cy.loginAsSuperAdmin();
    cy.visit('/admin/hotels');
  });

  it('should navigate to hotels list and display import button', () => {
    cy.contains('h1', 'Hotels').should('be.visible');
    cy.contains('button', 'Import Bulk').should('be.visible');
  });

  it('should open the bulk import dialog and validate empty tour selection', () => {
    cy.contains('button', 'Import Bulk').click();
    cy.contains('h2', 'Batch Import Hotels').should('be.visible');

    // Without a tour selected, the browse button should be disabled
    cy.contains('button', 'Browse File').should('be.disabled');
    cy.contains('Please select a Tour above before uploading.').should('be.visible');
  });

  it('should enable file upload when tour is selected', () => {
    cy.contains('button', 'Import Bulk').click();
    
    // Select a tour from dropdown (assumes at least one mocked tour exists)
    cy.get('mat-select').click();
    cy.get('mat-option').first().click();

    cy.contains('button', 'Browse File').should('not.be.disabled');
  });
});
