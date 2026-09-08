describe('Coordinator Candidacy Flow & Admin Assignment', () => {
  it('should allow submitting a candidacy when trips are available', () => {
    cy.intercept('POST', '**/google.firestore.v1.Firestore/Listen/**', (req) => {
      const responses = [];
      let targetId = -1;
      let collectionId = '';
      let docNameQuery = '';

      try {
        let bodyStr = '';
        if (typeof req.body === 'string') {
          bodyStr = decodeURIComponent(req.body);
        } else if (req.body && typeof req.body === 'object') {
          if (req.body.req0__data__) {
            bodyStr = Object.values(req.body).join('');
          } else {
            bodyStr = JSON.stringify(req.body);
          }
        }

        const colMatch = /"collectionId"\s*:\s*"([^"]+)"/.exec(bodyStr);
        const targetMatch = /"targetId"\s*:\s*(\d+)/.exec(bodyStr);
        const docMatch = /"documents"\s*:\s*\["([^"]+)"\]/.exec(bodyStr);
        if (colMatch) collectionId = colMatch[1];
        if (targetMatch) targetId = parseInt(targetMatch[1]);
        if (docMatch) {
            docNameQuery = docMatch[1];
            collectionId = docNameQuery.split('/')[5] || '';
        }
      } catch (e) {
        console.error('Error parsing Listen body', e);
      }

      if (targetId !== -1) {
        if (collectionId === 'trips') {
          responses.push({
            documentChange: {
              document: {
                name: docNameQuery || 'projects/travel-handling-app/databases/(default)/documents/trips/trip123',
                fields: {
                  destination: { stringValue: 'Japan' },
                  code: { stringValue: 'JP-2026' },
                  startDate: { stringValue: '2026-05-01' },
                  endDate: { stringValue: '2026-05-15' },
                  status: { stringValue: 'PUBLISHED' },
                  tourId: { stringValue: 'tour123' },
                  coordinatorId: { nullValue: null },
                  adminIds: { arrayValue: { values: [{ stringValue: 'mock-admin-uid' }] } },
                  checklist: {
                    arrayValue: {
                      values: [
                        {
                          mapValue: {
                            fields: {
                              id: { stringValue: 'default-1' },
                              task: { stringValue: 'Confirm Hotel' },
                              isCompleted: { booleanValue: false }
                            }
                          }
                        }
                      ]
                    }
                  }
                },
                createTime: '2023-01-01T00:00:00Z',
                updateTime: '2023-01-01T00:00:00Z'
              },
              targetIds: [targetId]
            }
          });
        } else if (collectionId === 'tours') {
          responses.push({
            documentChange: {
              document: {
                name: docNameQuery || 'projects/travel-handling-app/databases/(default)/documents/tours/tour123',
                fields: {
                  tourWeRoadCode: { stringValue: 'mock-tour-code' },
                  country: { stringValue: 'Japan' },
                  tourLength: { integerValue: 14 },
                  nationalities: { arrayValue: { values: [{ stringValue: 'IT' }] } },
                  adminIds: { arrayValue: { values: [{ stringValue: 'mock-admin-uid' }] } }
                },
                createTime: '2023-01-01T00:00:00Z',
                updateTime: '2023-01-01T00:00:00Z'
              },
              targetIds: [targetId]
            }
          });
        } else if (collectionId === 'admins' || collectionId === 'users') {
          responses.push({
            documentChange: {
              document: {
                name: docNameQuery || 'projects/travel-handling-app/databases/(default)/documents/admins/mock-admin-uid',
                fields: { role: { stringValue: 'SUPER_ADMIN' } },
                createTime: '2023-01-01T00:00:00Z',
                updateTime: '2023-01-01T00:00:00Z'
              },
              targetIds: [targetId]
            }
          });
        }

        // Add the CURRENT targetChange regardless of whether we had documents
        responses.push({
          targetChange: { targetChangeType: 'CURRENT', targetIds: [targetId] }
        });
      }

      req.reply({
        statusCode: 200,
        body: responses
      });
    }).as('firestoreListen');

    cy.intercept('POST', '**/google.firestore.v1.Firestore/Write/**', {
      statusCode: 200,
      body: {
        commitTime: '2026-01-01T00:00:00Z',
        writeResults: [{ updateTime: '2026-01-01T00:00:00Z' }]
      }
    }).as('firestoreWrite');

    cy.visit('/mock-tour-code/public', {
      onBeforeLoad(win) {
        win.localStorage.setItem('bypassAuth', 'true');
      }
    });

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
      const responses = [];
      let targetId = -1;
      let collectionId = '';
      let docNameQuery = '';

      try {
        let bodyStr = '';
        if (typeof req.body === 'string') {
          bodyStr = decodeURIComponent(req.body);
        } else if (req.body && typeof req.body === 'object') {
          if (req.body.req0__data__) {
            bodyStr = Object.values(req.body).join('');
          } else {
            bodyStr = JSON.stringify(req.body);
          }
        }

        const colMatch = /"collectionId"\s*:\s*"([^"]+)"/.exec(bodyStr);
        const targetMatch = /"targetId"\s*:\s*(\d+)/.exec(bodyStr);
        const docMatch = /"documents"\s*:\s*\["([^"]+)"\]/.exec(bodyStr);
        if (colMatch) collectionId = colMatch[1];
        if (targetMatch) targetId = parseInt(targetMatch[1]);
        if (docMatch) {
            docNameQuery = docMatch[1];
            collectionId = docNameQuery.split('/')[5] || '';
        }
      } catch (e) {
        console.error('Error parsing Listen body', e);
      }

      if (targetId !== -1) {
        if (collectionId === 'trips') {
          responses.push({
            documentChange: {
              document: {
                name: docNameQuery || 'projects/travel-handling-app/databases/(default)/documents/trips/trip123',
                fields: {
                  destination: { stringValue: 'Japan' },
                  code: { stringValue: 'JP-2026' },
                  startDate: { stringValue: '2026-05-01' },
                  endDate: { stringValue: '2026-05-15' },
                  status: { stringValue: 'PUBLISHED' },
                  tourId: { stringValue: 'tour123' },
                  coordinatorId: { nullValue: null },
                  adminIds: { arrayValue: { values: [{ stringValue: 'mock-admin-uid' }] } },
                  checklist: {
                    arrayValue: {
                      values: [
                        {
                          mapValue: {
                            fields: {
                              id: { stringValue: 'default-1' },
                              task: { stringValue: 'Confirm Hotel' },
                              isCompleted: { booleanValue: false }
                            }
                          }
                        }
                      ]
                    }
                  }
                },
                createTime: '2023-01-01T00:00:00Z',
                updateTime: '2023-01-01T00:00:00Z'
              },
              targetIds: [targetId]
            }
          });
        } else if (collectionId === 'tours') {
          responses.push({
            documentChange: {
              document: {
                name: docNameQuery || 'projects/travel-handling-app/databases/(default)/documents/tours/tour123',
                fields: {
                  tourWeRoadCode: { stringValue: 'mock-tour-code' },
                  country: { stringValue: 'Japan' },
                  tourLength: { integerValue: 14 },
                  nationalities: { arrayValue: { values: [{ stringValue: 'IT' }] } },
                  adminIds: { arrayValue: { values: [{ stringValue: 'mock-admin-uid' }] } }
                },
                createTime: '2023-01-01T00:00:00Z',
                updateTime: '2023-01-01T00:00:00Z'
              },
              targetIds: [targetId]
            }
          });
        } else if (collectionId === 'admins' || collectionId === 'users') {
          responses.push({
            documentChange: {
              document: {
                name: docNameQuery || 'projects/travel-handling-app/databases/(default)/documents/admins/mock-admin-uid',
                fields: { role: { stringValue: 'SUPER_ADMIN' } },
                createTime: '2023-01-01T00:00:00Z',
                updateTime: '2023-01-01T00:00:00Z'
              },
              targetIds: [targetId]
            }
          });
        }

        // Add the CURRENT targetChange regardless of whether we had documents
        responses.push({
          targetChange: { targetChangeType: 'CURRENT', targetIds: [targetId] }
        });
      }

      req.reply({
        statusCode: 200,
        body: responses
      });
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
    
    // Use cy.contains('button', 'Run Automatic Assignment')
    cy.contains('button', 'Run Automatic Assignment').click();
    
    cy.get('mat-dialog-container').should('be.visible');
    cy.get('mat-dialog-container button').contains('Confirm').click();
    cy.get('snack-bar-container').should('contain', 'Assignment batch complete');
  });
});
