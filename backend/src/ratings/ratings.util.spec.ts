import { acceptanceRateToLevel, computeAdjustedLevel, levelToTier } from './ratings.util';

describe('ratings.util', () => {
  describe('acceptanceRateToLevel', () => {
    it('정답률 100% → level 0 (가장 쉬움)', () => {
      expect(acceptanceRateToLevel(100)).toBe(0);
    });
    it('정답률 0% → level 5 (가장 어려움)', () => {
      expect(acceptanceRateToLevel(0)).toBe(5);
    });
    it('정답률 50% → level 2.5 (선형 변환)', () => {
      expect(acceptanceRateToLevel(50)).toBe(2.5);
    });
    it('null → null (정답률 미상)', () => {
      expect(acceptanceRateToLevel(null)).toBeNull();
      expect(acceptanceRateToLevel(undefined)).toBeNull();
    });
    it('범위 밖 입력은 0~100 으로 clamp', () => {
      expect(acceptanceRateToLevel(150)).toBe(0);
      expect(acceptanceRateToLevel(-10)).toBe(5);
    });
  });

  describe('computeAdjustedLevel — Bayesian shrinkage', () => {
    it('피드백 0개 + 정답률 null → 원본 레벨 그대로', () => {
      const result = computeAdjustedLevel({
        origLevel: 3,
        acceptanceRate: null,
        feedbackLevels: [],
      });
      // numerator = 2*3 = 6, denominator = 2 (ALPHA only)
      expect(result).toBe(3);
    });

    it('피드백 0개 + 정답률 50% → α/β 평균', () => {
      const result = computeAdjustedLevel({
        origLevel: 2,
        acceptanceRate: 50, // → arLevel 2.5
        feedbackLevels: [],
      });
      // (2*2 + 2*2.5) / (2+2) = (4+5)/4 = 2.25
      expect(result).toBe(2.25);
    });

    it('피드백 누적 시 prior 무게가 점점 줄어듦', () => {
      const params = { origLevel: 1, acceptanceRate: 100 };
      // arLevel = 0
      // 피드백 0개: (2*1 + 2*0) / 4 = 0.5
      const r0 = computeAdjustedLevel({ ...params, feedbackLevels: [] });
      // 피드백 1개 [5]: (2*1 + 2*0 + 5) / (4+1) = 7/5 = 1.4
      const r1 = computeAdjustedLevel({ ...params, feedbackLevels: [5] });
      // 피드백 10개 [5,5,...]: (2 + 0 + 50) / 14 ≈ 3.71
      const r10 = computeAdjustedLevel({ ...params, feedbackLevels: Array(10).fill(5) });

      expect(r0).toBe(0.5);
      expect(r1).toBeCloseTo(1.4, 5);
      expect(r10).toBeGreaterThan(r1);
      expect(r10).toBeLessThan(5); // 5 에 수렴하지만 도달은 안 함 (prior 가 끌어내림)
    });
  });

  describe('levelToTier', () => {
    it.each([
      [0.0, 'BRONZE_III'],
      [0.4, 'BRONZE_II'],
      [0.7, 'BRONZE_I'],
      [1.0, 'SILVER_III'],
      [2.5, 'GOLD_II'],
      [3.99, 'PLATINUM_I'],
      [4.0, 'DIAMOND_III'],
      [4.99, 'DIAMOND_I'],
    ])('level %f → %s', (level, expected) => {
      expect(levelToTier(level)).toBe(expected);
    });

    it('범위 밖 입력은 clamp 됨', () => {
      expect(levelToTier(-1)).toBe('BRONZE_III');
      expect(levelToTier(100)).toBe('DIAMOND_I');
    });
  });
});
