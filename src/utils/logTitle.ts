/**
 * Cleanly formats/truncates a log task title up to word or character limit
 * without chopping words in half, and cleanly appending '...' when truncated.
 * Automatically recovers from legacy cut words (e.g. "With V" -> "With Vite").
 */
export function formatLogTitle(task?: string, description?: string, maxWords = 16, maxChars = 120): string {
  if (!task && !description) return 'Work Log';

  const rawTask = (task || '').trim();
  const desc = (description || '').trim();

  // If rawTask was sliced mid-word or is an incomplete un-ellipsized prefix of description, heal from desc
  const isPrefix = Boolean(desc && rawTask && desc.startsWith(rawTask));
  const cutMidWord = Boolean(isPrefix && desc.length > rawTask.length && !/\s|[.,;:!?\-]/.test(desc[rawTask.length]));
  const textToFormat = (!rawTask || cutMidWord || (isPrefix && !rawTask.endsWith('...') && desc.length > rawTask.length))
    ? desc
    : (rawTask || desc);

  const clean = textToFormat.replace(/\s+/g, ' ').trim();
  const words = clean.split(' ');

  if (words.length <= maxWords && clean.length <= maxChars) {
    return clean.replace(/[,;:\-.\s]+$/, '');
  }

  const result: string[] = [];
  let currentLen = 0;
  for (const w of words) {
    if (result.length >= maxWords) break;
    const addedLen = currentLen === 0 ? w.length : w.length + 1;
    if (currentLen + addedLen > maxChars) {
      break;
    }
    result.push(w);
    currentLen += addedLen;
  }

  if (result.length === 0) {
    return words[0].slice(0, maxChars).trim() + '...';
  }

  const joined = result.join(' ').replace(/[,;:\-.\s]+$/, '');
  return `${joined}...`;
}
