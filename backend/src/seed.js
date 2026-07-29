const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Word = require('./models/Word');
const wordsJson = require('./data/words.json');

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set - cannot seed. Set it in backend/.env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('[seed] connected to MongoDB');

  const docs = [];
  for (const [category, words] of Object.entries(wordsJson)) {
    for (const text of words) {
      docs.push({ text: text.toLowerCase().trim(), category });
    }
  }

  let inserted = 0;
  for (const doc of docs) {
    const res = await Word.updateOne({ text: doc.text }, { $set: doc }, { upsert: true });
    if (res.upsertedCount) inserted += 1;
  }

  console.log(`[seed] processed ${docs.length} words, inserted ${inserted} new`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
