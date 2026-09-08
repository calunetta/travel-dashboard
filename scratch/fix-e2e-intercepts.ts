import * as fs from 'fs';
import * as path from 'path';

const files = [
  'apps/travel-admin-e2e/src/e2e/admin-trips.cy.ts',
  'apps/travel-admin-e2e/src/e2e/admin-trip-detail.cy.ts',
  'apps/travel-admin-e2e/src/e2e/candidacy-flow.cy.ts'
];

const replacementMockLogic = `
    cy.intercept('POST', '**/google.firestore.v1.Firestore/Listen/**', (req) => {
      const responses = [];
      let targetId = -1;
      let collectionId = '';
      let docNameQuery = '';

      if (typeof req.body === 'object' && req.body.addTarget) {
        targetId = req.body.addTarget.targetId;
        const query = req.body.addTarget.query;
        if (query?.structuredQuery?.from?.[0]?.collectionId) {
           collectionId = query.structuredQuery.from[0].collectionId;
        } else if (req.body.addTarget.documents?.documents?.[0]) {
           docNameQuery = req.body.addTarget.documents.documents[0];
           collectionId = docNameQuery.split('/')[5] || ''; 
        }
      } else {
        // Fallback for WebChannel if it somehow slips through
        const bodyStr = typeof req.body === 'string' ? decodeURIComponent(req.body) : JSON.stringify(req.body);
        const colMatch = /"collectionId"\\s*:\\s*"([^"]+)"/.exec(bodyStr);
        const targetMatch = /"targetId"\\s*:\\s*(\\d+)/.exec(bodyStr);
        const docMatch = /"documents"\\s*:\\s*\\["([^"]+)"\\]/.exec(bodyStr);
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
`;

for (const file of files) {
  const p = path.resolve(process.cwd(), file);
  const content = fs.readFileSync(p, 'utf8');
  
  // Replace everything between cy.intercept('POST', '**/google.firestore.v1.Firestore/Listen/**' and }).as('firestoreListen');
  const regex = /cy\.intercept\('POST',\s*'[^']*Firestore\/Listen[^']*',\s*\(req\)\s*=>\s*\{[\s\S]*?\}\)\.as\('firestoreListen'\);/g;
  
  const newContent = content.replace(regex, replacementMockLogic.trim());
  fs.writeFileSync(p, newContent);
  console.log(`Updated ${file}`);
}
