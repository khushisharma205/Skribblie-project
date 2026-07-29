/**
 * Scoring rules:
 * - Correct guessers earn points based on how much draw time remains when they
 *   guess (faster = more points) and their guess order (earlier = more points).
 * - The drawer earns points proportional to how many players guessed correctly.
 */

const BASE_POINTS = 100;
const MIN_POINTS = 20;
const ORDER_PENALTY = 15;

/**
 * @param {number} timeLeftMs remaining draw time in ms when the guess landed
 * @param {number} totalDrawTimeMs total draw time for the round in ms
 * @param {number} guessOrder 0-based index of this correct guess among all correct guesses
 */
function calculateGuesserScore(timeLeftMs, totalDrawTimeMs, guessOrder) {
  const timeFraction = totalDrawTimeMs > 0 ? Math.max(0, timeLeftMs / totalDrawTimeMs) : 0;
  const timeBonus = Math.round(timeFraction * BASE_POINTS);
  const orderPenalty = guessOrder * ORDER_PENALTY;
  return Math.max(MIN_POINTS, BASE_POINTS + timeBonus - orderPenalty);
}

/**
 * Drawer gets points based on fraction of non-drawer players who guessed correctly.
 * @param {number} correctGuessers number of players who guessed correctly
 * @param {number} totalGuessers total players who could have guessed (excludes drawer)
 */
function calculateDrawerScore(correctGuessers, totalGuessers) {
  if (totalGuessers <= 0) return 0;
  const fraction = correctGuessers / totalGuessers;
  return Math.round(fraction * BASE_POINTS);
}

module.exports = { calculateGuesserScore, calculateDrawerScore };
