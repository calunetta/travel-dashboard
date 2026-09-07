describe('Coordinator Candidacy Flow & Admin Assignment', () => {
  it('should allow submitting a candidacy when trips are available', () => {
    cy.intercept('POST', '**/google.firestore.v1.Firestore/Listen/**', (req) => {
      if (JSON.stringify(req.body).includes('tourWeRoadCode')) {
        req.reply({
          statusCode: 200,
          body: [
            {
              documentChange: {
                document: {
                  name: 'projects/travel-handling-app/databases/(default)/documents/tours/mock-tour',
                  fields: {
                    tourName: { stringValue: 'Japan Mock Tour' },
                    tourWeRoadCode: { stringValue: 'mock-tour-code' },
                    country: { stringValue: 'Japan' }
                  },
                  createTime: '2023-01-01T00:00:00Z',
                  updateTime: '2023-01-01T00:00:00Z'
                },
                targetIds: [req.body.addTarget?.targetId ?? 1]
              }
            },
            {
              targetChange: { targetChangeType: 'CURRENT', targetIds: [req.body.addTarget?.targetId ?? 1] }
            }
          ]
        });
      } else if (JSON.stringify(req.body).includes('trips')) {
        req.reply({
          statusCode: 200,
          body: [
            {
              documentChange: {
                document: {
                  name: 'projects/travel-handling-app/databases/(default)/documents/trips/mock-trip',
                  fields: {
                    destination: { stringValue: 'Japan' },
                    code: { stringValue: 'JP-2026' },
                    tourId: { stringValue: 'tour123' },
                    status: { stringValue: 'PUBLISHED' },
                    nationality: { stringValue: 'IT' },
                    startDate: { stringValue: '2026-10-01' },
                    endDate: { stringValue: '2026-10-15' }
                  },
                  createTime: '2023-01-01T00:00:00Z',
                  updateTime: '2023-01-01T00:00:00Z'
                },
                targetIds: [req.body.addTarget?.targetId ?? 1]
              }
            },
            {
              targetChange: { targetChangeType: 'CURRENT', targetIds: [req.body.addTarget?.targetId ?? 1] }
            }
          ]
        });
      } else {
        req.reply({
          statusCode: 200,
          body: [
            { targetChange: { targetChangeType: 'CURRENT', targetIds: [req.body.addTarget?.targetId ?? 1] } }
          ]
        });
      }
    }).as('firestoreListen');

    cy.intercept('POST', '**/google.firestore.v1.Firestore/Write/**', {
      statusCode: 200,
      body: {
        commitTime: '2026-01-01T00:00:00Z',
        writeResults: [{ updateTime: '2026-01-01T00:00:00Z' }]
      }
    }).as('firestoreWrite');

    cy.visit('/mock-tour-code/public');

    // Wait for the Listen
    cy.wait('@firestoreListen');

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
    cy.intercept('POST', '**/google.firestore.v1.Firestore/Listen/**', (req) => {
      if (JSON.stringify(req.body).includes('admins')) {
        req.reply({
          statusCode: 200,
          body: [
            {
              documentChange: {
                document: {
                  name: req.body.addTarget?.documents?.documents[0] ?? 'mock',
                  fields: { role: { stringValue: 'SUPER_ADMIN' } },
                  createTime: '2023-01-01T00:00:00Z',
                  updateTime: '2023-01-01T00:00:00Z'
                },
                targetIds: [req.body.addTarget?.targetId ?? 1]
              }
            },
            {
              targetChange: { targetChangeType: 'CURRENT', targetIds: [req.body.addTarget?.targetId ?? 1] }
            }
          ]
        });
      } else if (JSON.stringify(req.body).includes('candidacies')) {
        req.reply({
          statusCode: 200,
          body: [
            {
              documentChange: {
                document: {
                  name: 'projects/travel-handling-app/databases/(default)/documents/candidacies/mock-candidacy',
                  fields: {
                    name: { stringValue: 'John' },
                    surname: { stringValue: 'Doe' },
                    status: { stringValue: 'PENDING' },
                    nationality: { stringValue: 'IT' },
                    tripId: { stringValue: 'mock-trip' }
                  },
                  createTime: '2026-01-01T00:00:00Z',
                  updateTime: '2026-01-01T00:00:00Z'
                },
                targetIds: [req.body.addTarget?.targetId ?? 1]
              }
            },
            {
              targetChange: { targetChangeType: 'CURRENT', targetIds: [req.body.addTarget?.targetId ?? 1] }
            }
          ]
        });
      } else if (JSON.stringify(req.body).includes('trips')) {
        req.reply({
          statusCode: 200,
          body: [
            {
              documentChange: {
                document: {
                  name: 'projects/travel-handling-app/databases/(default)/documents/trips/mock-trip',
                  fields: {
                    destination: { stringValue: 'Japan' },
                    nationality: { stringValue: 'IT' },
                    startDate: { stringValue: '2026-10-01' },
                    endDate: { stringValue: '2026-10-15' }
                  }
                },
                targetIds: [req.body.addTarget?.targetId ?? 1]
              }
            },
            {
              targetChange: { targetChangeType: 'CURRENT', targetIds: [req.body.addTarget?.targetId ?? 1] }
            }
          ]
        });
      } else {
        req.reply({
          statusCode: 200,
          body: [
            { targetChange: { targetChangeType: 'CURRENT', targetIds: [req.body.addTarget?.targetId ?? 1] } }
          ]
        });
      }
    }).as('firestoreListen');

    cy.intercept('POST', '**/google.firestore.v1.Firestore/Write/**', {
      statusCode: 200,
      body: {
        commitTime: '2026-01-01T00:00:00Z',
        writeResults: [{ updateTime: '2026-01-01T00:00:00Z' }]
      }
    }).as('firestoreWrite');
    
    cy.intercept('POST', '**/google.firestore.v1.Firestore/Commit/**', {
      statusCode: 200,
      body: {
        commitTime: '2026-01-01T00:00:00Z',
        writeResults: [{ updateTime: '2026-01-01T00:00:00Z' }]
      }
    }).as('firestoreCommit');

    cy.visit('/admin/candidacies', {
      onBeforeLoad(win) {
        win.localStorage.setItem('bypassAuth', 'true');
      }
    });

    cy.wait('@firestoreListen');
    
    // Use cy.get('button').contains('Run Automatic Assignment') instead of cy.contains on the whole page to specifically target the button
    cy.get('button').contains('Run Automatic Assignment').click();
    
    cy.get('mat-dialog-container').should('be.visible');
    cy.get('mat-dialog-container button').contains('Confirm').click();
    cy.get('snack-bar-container').should('contain', 'Assignment batch complete');
  });
});
