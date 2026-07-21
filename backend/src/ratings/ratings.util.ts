import { Tier } from '@prisma/client';

// 집계식 가중치
const ALPHA = 2; // 원본 프로그래머스 레벨의 prior 가중치
const BETA = 2; // 정답률 기반 레벨의 가중치

/**
 * 정답률(0~100)을 레벨 척도(0~5)로 변환.
 * 정답률이 낮을수록 어려운 문제 → 높은 레벨.
 * 선형: 100% → 0, 0% → 5
 */
export function acceptanceRateToLevel(
  rate: number | null | undefined,
): number | null {
  if (rate == null) return null;
  const clamped = Math.max(0, Math.min(100, rate));
  return 5 * (1 - clamped / 100);
}

/**
 * Bayesian shrinkage 집계:
 *   (α × origLevel + β × arLevel + Σfeedback) / (α + β + n)
 *
 * - 피드백 0개일 때: 원본 + 정답률 평균으로 fallback
 * - 피드백 누적되면 사용자 평균으로 점진 이동
 */
export function computeAdjustedLevel(params: {
  origLevel: number;
  acceptanceRate: number | null;
  feedbackLevels: number[];
}): number {
  const { origLevel, acceptanceRate, feedbackLevels } = params;
  const arLevel = acceptanceRateToLevel(acceptanceRate);

  let numerator = ALPHA * origLevel;
  let denominator = ALPHA;

  if (arLevel !== null) {
    numerator += BETA * arLevel;
    denominator += BETA;
  }

  for (const fb of feedbackLevels) {
    numerator += fb;
    denominator += 1;
  }

  return numerator / denominator;
}

/**
 * 보정 레벨(float 0.0~5.0) → 티어 enum.
 *   0.0~1.0: BRONZE (III → II → I)
 *   1.0~2.0: SILVER
 *   2.0~3.0: GOLD
 *   3.0~4.0: PLATINUM
 *   4.0~5.0: DIAMOND
 * 각 구간을 3등분하여 sub-tier 결정.
 */
export function levelToTier(level: number): Tier {
  const clamped = Math.max(0, Math.min(4.9999, level));
  const familyIdx = Math.floor(clamped); // 0~4
  const subIdx = Math.floor((clamped - familyIdx) * 3); // 0~2

  const families = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'] as const;
  const subs = ['III', 'II', 'I'] as const;
  return `${families[familyIdx]}_${subs[subIdx]}` as Tier;
}

// 티어 정렬 순서 (낮음 → 높음). 필터링/슬라이더 인덱스에 사용.
export const TIER_ORDER: Tier[] = [
  'BRONZE_III',
  'BRONZE_II',
  'BRONZE_I',
  'SILVER_III',
  'SILVER_II',
  'SILVER_I',
  'GOLD_III',
  'GOLD_II',
  'GOLD_I',
  'PLATINUM_III',
  'PLATINUM_II',
  'PLATINUM_I',
  'DIAMOND_III',
  'DIAMOND_II',
  'DIAMOND_I',
];
