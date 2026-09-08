describe('Coordinator Candidacy Flow & Admin Assignment', () => {
  it('should allow submitting a candidacy when trips are available', () => {
    cy.visit('/mock-tour-code/public', {
      onBeforeLoad(win) {
        win.localStorage.setItem('bypassAuth', 'true');
      }
    });

    // Select the trip in the form
    cy.get('mat-select[formControlName="tripIds"]').click();
    cy.get('mat-option').contains('Japan').click();
    // Close the multiple select by pressing ESC or clicking outside
    cy.get('body').type('{esc}');

    // Fill the rest of the form
    cy.get('input[formControlName="name"]').type('John');
    cy.get('input[formControlName="surname"]').type('Doe');
    cy.get('input[formControlName="email"]').type('john.doe@example.com');
    cy.get('input[formControlName="whatsapp"]').type('+391234567890');

    // Submit the form
    cy.get('button[type="submit"]').click();
    
    // Should redirect to success
    cy.url().should('include', '/success');
  });

  it('should allow admin to auto-assign pending candidacies', () => {
    cy.visit('/admin/candidacies', {
      onBeforeLoad(win) {
        win.localStorage.setItem('bypassAuth', 'true');
      }
    });

    // Use cy.contains('button', 'Run Automatic Assignment')
    cy.contains('button', 'Run Automatic Assignment').click();
    
    cy.get('mat-dialog-container').should('be.visible');
    cy.get('mat-dialog-container button').contains('Confirm').click();
    cy.get('snack-bar-container').should('contain', 'Assignment batch complete');
  });
});
