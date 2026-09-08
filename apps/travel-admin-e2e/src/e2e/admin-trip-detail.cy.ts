describe('Admin Trip Detail Flow', () => {
  beforeEach(() => {
    cy.visit('/admin/trips/trip123', {
      onBeforeLoad(win) {
        win.localStorage.setItem('bypassAuth', 'true');
      }
    });
  });

  it('should render checklist items and allow toggling them', () => {
    // The trip detail should render
    cy.contains('Japan').should('be.visible');
    
    // Check checklist items exist
    cy.contains('Confirm Hotel').should('exist');

    // Click to toggle the first item
    cy.get('mat-checkbox').first().find('input[type="checkbox"]').click({ force: true });
  });
});

