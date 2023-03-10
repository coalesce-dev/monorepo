export function createId(length = 8) {
  return Array.from(new Array(length))
    .map(() => String.fromCharCode(Math.floor(Math.random() * (126 - 32)) + 32))
    .join('');
}
