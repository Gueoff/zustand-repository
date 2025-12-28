/**
 * Generate random ID (test purpose)
 * @param length
 */
export function randomId(length = 8) {
  return Math.random()
    .toString(36)
    .slice(2, 2 + length)
}
