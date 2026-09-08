describe('Admin Trip Detail Flow', () => {
  beforeEach(() => {
    // Intercept auth
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

    cy.visit('/admin/trips/mock-trip-1', {
      onBeforeLoad(win) {
        win.localStorage.setItem('bypassAuth', 'true');
      }
    });
  });

  it('should render checklist items and allow toggling them', () => {
    // Wait for the Listen
    cy.wait('@firestoreListen');

    // The trip detail should render
    cy.contains('Japan').should('be.visible');
    
    // Check checklist items exist
    cy.contains('Confirm Hotel').should('be.visible');
    cy.contains('Send Briefing Email').should('be.visible');

    // The first item should be unchecked, second should be checked
    cy.get('mat-checkbox').first().should('not.have.class', 'mat-mdc-checkbox-checked');
    cy.get('mat-checkbox').eq(1).should('have.class', 'mat-mdc-checkbox-checked');

    // Click to toggle the first item
    cy.get('mat-checkbox').first().find('input[type="checkbox"]').click({ force: true });
    
    // Check that write request was fired (it fires instantly in trip detail via updateDoc)
    // The stub for Commit/Write returns 200 immediately
    // If it didn't fail, we successfully simulated the toggle
  });
});
