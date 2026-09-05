describe('Admin Area', () => {
  beforeEach(() => {
    cy.visit('/admin/dashboard', {
      onBeforeLoad(win) {
        win.localStorage.setItem('bypassAuth', 'true');
      }
    });
  });

  it('should toggle sidenav using mobile burger menu', () => {
    // Set viewport to mobile size
    cy.viewport('iphone-x');

    // The sidenav should be hidden initially on mobile
    cy.get('mat-sidenav').should('have.css', 'visibility', 'hidden');

    // Click the burger menu icon in the toolbar
    cy.get('button[aria-label="Toggle sidenav"]').click();

    // The sidenav should now be visible
    cy.get('mat-sidenav').should('be.visible');

    // Click outside or on a link to close it (for this test, we can just close it by clicking the backdrop)
    cy.get('.mat-drawer-backdrop').click({ force: true });
    
    // Should be hidden again
    cy.get('mat-sidenav').should('have.css', 'visibility', 'hidden');
  });

  it('should have default calendar filters set', () => {
    // Navigate to calendar
    cy.visit('/admin/calendar', {
      onBeforeLoad(win) {
        win.localStorage.setItem('bypassAuth', 'true');
      }
    });

    // Calendar should default to IT nationality
    cy.get('mat-select').first().should('contain', 'IT');

    // Should load calendar grid
    cy.get('.calendar-grid').should('exist');
  });
});
