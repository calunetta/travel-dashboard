describe('General Smoke Tests', () => {
  beforeEach(() => {
    // Intercept admins fetch and all other Listens
    cy.intercept('POST', '**/google.firestore.v1.Firestore/Listen/**', (req) => {
      if (req.body?.addTarget?.documents?.documents[0]?.includes('admins')) {
        req.reply({
          statusCode: 200,
          body: [
            {
              documentChange: {
                document: {
                  name: req.body.addTarget.documents.documents[0],
                  fields: { role: { stringValue: 'SUPER_ADMIN' } },
                  createTime: '2023-01-01T00:00:00Z',
                  updateTime: '2023-01-01T00:00:00Z'
                },
                targetIds: [req.body.addTarget.targetId]
              }
            }
          ]
        });
      } else {
        // Return empty stream response for any other query (tours, coordinators, etc)
        // This prevents FirebaseError and allows the observable to emit []
        req.reply({
          statusCode: 200,
          body: [
            {
              targetChange: {
                targetChangeType: 'CURRENT',
                targetIds: [req.body.addTarget?.targetId ?? 1]
              }
            }
          ]
        });
      }
    }).as('firestoreListen');
  });

  it('should render Hotels page', () => {
    cy.visit('/admin/hotels', { onBeforeLoad(win) { win.localStorage.setItem('bypassAuth', 'true'); } });
    cy.get('h1').contains('Hotels');
    cy.get('table').should('exist');
  });

  it('should render Coordinators page', () => {
    cy.visit('/admin/coordinators', { onBeforeLoad(win) { win.localStorage.setItem('bypassAuth', 'true'); } });
    cy.get('h1').contains('Coordinators');
    cy.get('table').should('exist');
  });

  it('should render Tours page', () => {
    cy.visit('/admin/tours', { onBeforeLoad(win) { win.localStorage.setItem('bypassAuth', 'true'); } });
    cy.get('h1').contains('Tours');
    cy.get('table').should('exist');
  });

  it('should render Calendar page', () => {
    cy.visit('/admin/calendar', { onBeforeLoad(win) { win.localStorage.setItem('bypassAuth', 'true'); } });
    cy.get('h1').contains('Trip Calendar');
    cy.get('.calendar-grid').should('exist');
  });
});
