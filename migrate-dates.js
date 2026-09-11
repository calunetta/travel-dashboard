const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// 1. Initialize Firebase Admin using your downloaded service account key
const serviceAccount = require('./serviceAccountKey.json');
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// 2. Re-use the exact normalizer logic we built in Angular
function normalizeDateInput(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const s = dateStr.trim();
  
  const isoRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
  const slashRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const dashRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
  const compactRegex = /^(\d{4})(\d{2})(\d{2})$/;

  let year, month, day;

  if (isoRegex.test(s)) {
    [, year, month, day] = s.match(isoRegex);
  } else if (slashRegex.test(s) || dashRegex.test(s)) {
    let match = s.match(slashRegex);
    if (!match) match = s.match(dashRegex);
    [, day, month, year] = match;
  } else if (compactRegex.test(s)) {
    [, year, month, day] = s.match(compactRegex);
  } else {
    return null; 
  }

  return `${year}-${month}-${day}`;
}

async function migrateTrips() {
  const tripsRef = db.collection('trips');
  const snapshot = await tripsRef.get();
  
  let updatedCount = 0;
  const batch = db.batch();

  snapshot.forEach(doc => {
    const data = doc.data();
    let needsUpdate = false;
    const updates = {};

    const normStart = normalizeDateInput(data.startDate);
    if (normStart && normStart !== data.startDate) {
      updates.startDate = normStart;
      needsUpdate = true;
    }

    const normEnd = normalizeDateInput(data.endDate);
    if (normEnd && normEnd !== data.endDate) {
      updates.endDate = normEnd;
      needsUpdate = true;
    }

    if (needsUpdate) {
      batch.update(doc.ref, updates);
      updatedCount++;
      console.log(`Migrating trip ${doc.id}: ${data.startDate} -> ${normStart}`);
    }
  });

  if (updatedCount > 0) {
    await batch.commit();
    console.log(`Successfully migrated ${updatedCount} trips!`);
  } else {
    console.log('No trips needed migration.');
  }
}

migrateTrips().catch(console.error);
