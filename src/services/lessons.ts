export interface ExtractedLesson {
  vocabulary: string[];
  analogies: string[];
  decisionLogic: string[];
}

const MOTION_WORDS = [
  'clubhead',
  'swing',
  'swish',
  'whoosh',
  'tempo',
  'rhythm',
  'flow',
  'orbit',
  'axis',
  'center',
  'motion',
  'momentum',
  'brush',
  'feel',
  'continuous',
  'unhurried',
  'gravity',
  'arc',
];

const POSITION_WORDS = [
  'keep your',
  'left arm straight',
  'hold the lag',
  'stay in posture',
  'clear the hip',
  'on plane',
  'shoulder turn',
];

/**
 * Pulls Jones/de la Torre-style vocabulary from a coach transcript or notes.
 * Analogies are quoted phrases; decision logic is "if/then" or "when/then" lines.
 */
export function extractLessonLanguage(raw: string): ExtractedLesson {
  const text = raw.replace(/\s+/g, ' ').trim();
  if (!text) return { vocabulary: [], analogies: [], decisionLogic: [] };

  const lower = text.toLowerCase();
  const vocabulary = MOTION_WORDS.filter((word) => lower.includes(word));

  const analogies = Array.from(text.matchAll(/“([^”]+)”|"([^"]+)"/g))
    .map((match) => (match[1] || match[2] || '').trim())
    .filter((phrase) => phrase.split(' ').length >= 3)
    .slice(0, 12);

  const decisionLogic = text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => /^(if|when)\b/i.test(sentence) || /\bthen\b/i.test(sentence))
    .slice(0, 12);

  const rejected = POSITION_WORDS.filter((word) => lower.includes(word));
  if (rejected.length) {
    decisionLogic.unshift(
      `Filter: skip positional language (${rejected.join(', ')}). Prefer clubhead-motion cues.`,
    );
  }

  return { vocabulary, analogies, decisionLogic };
}
