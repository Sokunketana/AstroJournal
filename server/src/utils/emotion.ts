import { pipeline, type TextClassificationPipeline } from '@huggingface/transformers';
 
export type Emotion = 'happy' | 'sad' | 'angry' | 'calm' | 'neutral';

const MODEL_ID = 'SamLowe/roberta-base-go_emotions-onnx';
const CONFIDENCE_THRESHOLD = 0.5;

const LABEL_MAP: Record<string, Emotion> = {
  admiration: 'happy',
  amusement: 'happy',
  approval: 'happy',
  caring: 'happy',
  desire: 'happy',
  excitement: 'happy',
  gratitude: 'happy',
  joy: 'happy',
  love: 'happy',
  optimism: 'happy',
  pride: 'happy',
  relief: 'happy',
  sadness: 'sad',
  grief: 'sad',
  remorse: 'sad',
  disappointment: 'sad',
  anger: 'angry',
  annoyance: 'angry',
  disgust: 'angry',
  disapproval: 'angry',
  calm: 'calm',
  confusion: 'neutral',
  curiosity: 'neutral',
  embarrassment: 'neutral',
  fear: 'neutral',
  nervousness: 'neutral',
  realization: 'neutral',
  surprise: 'neutral',
  neutral: 'neutral',
};

const CALM_KEYWORDS = [
  'calm', 'peace', 'peaceful', 'relax', 'relaxed', 'relaxing', 'quiet',
  'serene', 'serenity', 'tranquil', 'tranquility', 'zen', 'mindful', 'mindfulness',
  'meditat', 'breathe', 'breathing', 'blissful', 'at peace',
];

let classifierPromise: Promise<TextClassificationPipeline> | null = null;

const getClassifier = (): Promise<TextClassificationPipeline> => {
  if (!classifierPromise) {
    classifierPromise = pipeline('text-classification', MODEL_ID, {
      dtype: 'q8',
    }) as Promise<TextClassificationPipeline>;
  }
  return classifierPromise;
};

const hasCalmHint = (content: string): boolean => {
  const normalized = content.toLowerCase();
  return CALM_KEYWORDS.some((keyword) => normalized.includes(keyword));
};

export const detectEmotion = async (content: string): Promise<Emotion> => {
  const text = content.trim();
  if (!text) return 'neutral';

  if (hasCalmHint(text)) return 'calm';

  try {
    const classifier = await getClassifier();
    const results = await classifier(text, { top_k: null });
    if (!Array.isArray(results) || results.length === 0) return 'neutral';

    const sums: Record<Emotion, number> = {
      happy: 0,
      sad: 0,
      angry: 0,
      calm: 0,
      neutral: 0,
    };

    for (const result of results) {
      const label = String(result.label).toLowerCase();
      const emotion = LABEL_MAP[label];
      if (emotion) sums[emotion] += result.score;
    }

    let best: Emotion = 'neutral';
    for (const emotion of Object.keys(sums) as Emotion[]) {
      if (sums[emotion] > sums[best]) best = emotion;
    }

    return sums[best] >= CONFIDENCE_THRESHOLD ? best : 'neutral';
  } catch (error) {
    console.error('Emotion classification failed:', error);
    return 'neutral';
  }
};
