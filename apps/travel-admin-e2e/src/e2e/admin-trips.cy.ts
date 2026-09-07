describe('Admin Trips Flow', () => {
  beforeEach(() => {
    // Intercept admins fetch to mock SUPER_ADMIN role
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
      } else if (req.body?.addTarget?.query) {
        // Mock Trips Query
        req.reply({
          statusCode: 200,
          body: [
            {
              documentChange: {
                document: {
                  name: 'projects/travel-handling-app/databases/(default)/documents/trips/mock-trip-1',
                  fields: {
                    destination: { stringValue: 'Japan' },
                    tourWeRoadCode: { stringValue: 'JP-2026' },
                    startDate: { stringValue: '2026-12-01' },
                    endDate: { stringValue: '2026-12-15' },
                    status: { stringValue: 'PUBLISHED' },
                    nationality: { stringValue: 'IT' }
                  },
                  createTime: '2023-01-01T00:00:00Z',
                  updateTime: '2023-01-01T00:00:00Z'
                },
                targetIds: [req.body.addTarget.targetId]
              }
            },
            {
              targetChange: { targetChangeType: 'CURRENT', targetIds: [req.body.addTarget.targetId] }
            }
          ]
        });
      }
    }).as('firestoreListen');

    // Intercept batch writes (Delete/Add)
    cy.intercept('POST', '**/google.firestore.v1.Firestore/Commit/**', {
      statusCode: 200,
      body: {
        commitTime: '2026-01-01T00:00:00Z',
        writeResults: [{ updateTime: '2026-01-01T00:00:00Z' }]
      }
    }).as('firestoreCommit');

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
    
    const csvContent = 'Destinazione,Start Date,End Date,Turno,Booking\nJapan,01/12/2026,15/12/2026,Turno 1,http://weroad.it';
    
    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from(csvContent),
      fileName: 'trips.csv',
      mimeType: 'text/csv',
    }, { force: true });

    // Click Confirm Import
    cy.get('button').contains('Confirm Import').click();

    // Should contain successfully
    cy.get('snack-bar-container').should('contain', 'successfully');
  });
});
