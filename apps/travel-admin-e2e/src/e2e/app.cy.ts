import { getGreeting } from '../support/app.po';

describe('travel-admin-e2e', () => {
  beforeEach(() => cy.visit('/'));

  it('should redirect to public candidacy flow', () => {
    cy.url().should('include', '/public');
    cy.get('tha-candidacy-form').should('exist');
  });
});
