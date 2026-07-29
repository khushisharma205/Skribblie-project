/** Normalize a guess/word for comparison: trim, lowercase, collapse whitespace. */
function normalize(str) {
  return String(str || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/** Classic Levenshtein edit distance between two strings. */
function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i += 1) dp[i][0] = i;
  for (let j = 0; j <= n; j += 1) dp[0][j] = j;

  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

/**
 * Compares a guess against the target word.
 * Returns 'correct' | 'close' | 'incorrect'.
 */
function matchGuess(guess, word) {
  const g = normalize(guess);
  const w = normalize(word);
  if (!g) return 'incorrect';
  if (g === w) return 'correct';

  const distance = levenshtein(g, w);
  const threshold = w.length > 5 ? 2 : 1;
  if (distance > 0 && distance <= threshold) return 'close';

  return 'incorrect';
}

module.exports = { normalize, levenshtein, matchGuess };
