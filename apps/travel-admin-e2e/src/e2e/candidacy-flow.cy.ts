describe('Coordinator Candidacy Flow', () => {
  beforeEach(() => {
    // Intercept Firestore queries for trips to return a mock trip
    cy.intercept('POST', '**/google.firestore.v1.Firestore/Listen/**', (req) => {
      // Mocking gRPC streams in Cypress is very complex. 
      // For a basic E2E test, we'll just test the form validation logic and UI elements.
    }).as('firestoreListen');

    cy.visit('/public');
  });

  it('should display the candidacy form', () => {
    cy.get('mat-card-title').contains('Apply as Coordinator');
    cy.get('form').should('exist');
  });

  it('should show a warning when there are no available trips', () => {
    cy.get('mat-icon').contains('warning');
    cy.contains('There are currently no trips available for assignment.');
  });

  it('should have the submit button disabled when there are no trips', () => {
    cy.get('button[type="submit"]').should('be.disabled');
  });
});
