import { getGreeting } from '../support/app.po';

describe('travel-admin-e2e', () => {
  beforeEach(() => cy.visit('/'));

  it('should redirect to login flow', () => {
    cy.url().should('include', '/login');
    cy.get('tha-login').should('exist');
  });
});
