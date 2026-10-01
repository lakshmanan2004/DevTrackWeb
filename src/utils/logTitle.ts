/**
 * Cleanly formats/truncates a log task title up to word or character limit
 * without chopping words in half, and cleanly appending '...' when truncated.
 */
export function formatLogTitle(task?: string, description?: string, maxWords = 10, maxChars = 75): string {
  if (!task && !description) return 'Work Log';

  const rawTask = (task || '').trim();
  const desc = (description || '').trim();

  // If rawTask is a raw un-ellipsized prefix of description and description is longer, use full description
  const textToFormat = (desc && desc.length > rawTask.length && desc.startsWith(rawTask) && !rawTask.endsWith('...'))
    ? desc
    : (rawTask || desc);

  const clean = textToFormat.replace(/\s+/g, ' ');
  const words = clean.split(' ');

  if (words.length <= maxWords && clean.length <= maxChars) {
    return clean;
  }

  const result: string[] = [];
  let currentLen = 0;
  for (const w of words) {
    if (result.length >= maxWords) break;
    const addedLen = currentLen === 0 ? w.length : w.length + 1;
    if (currentLen + addedLen > maxChars) {
      if (result.length === 0) {
        return w.slice(0, maxChars).trim() + '...';
      }
      break;
    }
    result.push(w);
    currentLen += addedLen;
  }

  const joined = result.join(' ').replace(/[,;:\-.\s]+$/, '');
  return `${joined}...`;
}
