const fs = require('fs');

const replacementFn = `
    cy.intercept('POST', '**/google.firestore.v1.Firestore/Listen/**', (req) => {
      const bodyStr = typeof req.body === 'string' ? decodeURIComponent(req.body) : JSON.stringify(req.body);
      
      const responses = [];
      
      // Match all addTarget blocks
      // A block usually contains "collectionId":"xyz" and "targetId":123
      const collectionMatches = [...bodyStr.matchAll(/"collectionId"\\s*:\\s*"([^"]+)"[\\s\\S]*?"targetId"\\s*:\\s*(\\d+)/g)];
      
      // Also match documents (for admin)
      const docMatches = [...bodyStr.matchAll(/"documents"\\s*:\\s*\\["([^"]+)"\\][\\s\\S]*?"targetId"\\s*:\\s*(\\d+)/g)];

      // Build responses for each target
      const targetIdsFound = [];

      for (const match of collectionMatches) {
        const collectionId = match[1];
        const targetId = parseInt(match[2]);
        targetIdsFound.push(targetId);

        if (collectionId === 'trips') {
          responses.push({
            documentChange: {
              document: {
                name: 'projects/travel-handling-app/databases/(default)/documents/trips/mock-trip-1',
                fields: {
                  destination: { stringValue: 'Japan' },
                  code: { stringValue: 'JP-2026' },
                  tourId: { stringValue: 'tour123' },
                  startDate: { stringValue: '2026-12-01' },
                  endDate: { stringValue: '2026-12-15' },
                  status: { stringValue: 'PUBLISHED' },
                  nationality: { stringValue: 'IT' },
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
                name: 'projects/travel-handling-app/databases/(default)/documents/tours/tour123',
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
        }
      }

      for (const match of docMatches) {
        const docName = match[1];
        const targetId = parseInt(match[2]);
        targetIdsFound.push(targetId);

        if (docName.includes('admins')) {
          responses.push({
            documentChange: {
              document: {
                name: docName,
                fields: { role: { stringValue: 'SUPER_ADMIN' } },
                createTime: '2023-01-01T00:00:00Z',
                updateTime: '2023-01-01T00:00:00Z'
              },
              targetIds: [targetId]
            }
          });
        }
      }

      // If no targets were found via regex (maybe different ordering in JSON), fallback to finding any targetId
      if (targetIdsFound.length === 0) {
        const fallbackMatches = [...bodyStr.matchAll(/"targetId"\\s*:\\s*(\\d+)/g)];
        for (const m of fallbackMatches) {
          targetIdsFound.push(parseInt(m[1]));
        }
      }

      // Add CURRENT targetChange for all found targetIds
      if (targetIdsFound.length > 0) {
        responses.push({
          targetChange: { targetChangeType: 'CURRENT', targetIds: targetIdsFound }
        });
      }

      req.reply({
        statusCode: 200,
        body: responses
      });
    }).as('firestoreListen');
`;

const files = [
  'apps/travel-admin-e2e/src/e2e/admin-trip-detail.cy.ts',
  'apps/travel-admin-e2e/src/e2e/admin-trips.cy.ts',
  'apps/travel-admin-e2e/src/e2e/candidacy-flow.cy.ts'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Find the block starting with cy.intercept('POST', '**/google.firestore.v1.Firestore/Listen/**'
  // and ending at .as('firestoreListen');
  
  const startIndex = content.indexOf("cy.intercept('POST', '**/google.firestore.v1.Firestore/Listen/**'");
  const endIndex = content.indexOf(".as('firestoreListen');", startIndex);
  
  if (startIndex !== -1 && endIndex !== -1) {
    const before = content.substring(0, startIndex);
    const after = content.substring(endIndex + ".as('firestoreListen');".length);
    fs.writeFileSync(file, before + replacementFn.trim() + after, 'utf8');
    console.log(`Updated ${file}`);
  }
});
