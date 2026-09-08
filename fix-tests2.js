const fs = require('fs');

const files = [
  'apps/travel-admin-e2e/src/e2e/admin-trip-detail.cy.ts',
  'apps/travel-admin-e2e/src/e2e/admin-trips.cy.ts',
  'apps/travel-admin-e2e/src/e2e/candidacy-flow.cy.ts'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(
    /targetIds: \[\(typeof req\.body === 'string' \? JSON\.parse\(req\.body\) : req\.body\)\?\.addTarget\?\.targetId \?\? 1\]/g, 
    "targetIds: [ parseInt((typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {})).match(/\"targetId\"\\s*:\\s*(\\d+)/)?.[1] || '1') ]"
  );

  fs.writeFileSync(file, content, 'utf8');
  console.log(`Updated ${file}`);
});
