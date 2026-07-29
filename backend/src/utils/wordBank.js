const fs = require('fs');
const path = require('path');
const Word = require('../models/Word');
const { isDbConnected } = require('../config/db');

const fallbackJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'data', 'words.json'), 'utf-8')
);

let cache = [];

function loadFallback() {
  cache = [];
  for (const [category, words] of Object.entries(fallbackJson)) {
    for (const text of words) {
      cache.push(text.toLowerCase().trim());
    }
  }
}

async function initWordBank() {
  if (isDbConnected()) {
    try {
      const docs = await Word.find({}, 'text').lean();
      if (docs.length > 0) {
        cache = docs.map((d) => d.text);
        console.log(`[wordBank] loaded ${cache.length} words from MongoDB`);
        return;
      }
    } catch (err) {
      console.warn('[wordBank] failed to load from DB, using local fallback:', err.message);
    }
  }
  loadFallback();
  console.log(`[wordBank] loaded ${cache.length} words from local JSON fallback`);
}

/** Returns `count` unique random words, excluding any in excludeSet. */
function getRandomWords(count, excludeSet = new Set()) {
  const pool = cache.filter((w) => !excludeSet.has(w));
  const source = pool.length >= count ? pool : cache;
  const shuffled = [...source].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

module.exports = { initWordBank, getRandomWords };
