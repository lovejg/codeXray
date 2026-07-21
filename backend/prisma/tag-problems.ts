/**
 * 프로그래머스 문제 알고리즘 태그 AI 분류 배치
 * 실행: npm run tag-problems
 *
 * problems-data.json + problem-descriptions.json 을 읽어
 * Claude Sonnet 4.6 으로 알고리즘 태그를 추론하고 ProblemTag 테이블에 upsert 한다.
 * - 고정 taxonomy 내에서만 선택하도록 프롬프트로 제약
 * - prompt caching: 시스템 프롬프트 + taxonomy 를 cache prefix 로 사용
 * - 결과는 problem-tags.json 에 캐싱하여 재실행 시 AI 호출 스킵 (idempotent)
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { TAGS } from './seed';

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = 'claude-sonnet-4-6';
const DATA_PATH = path.join(__dirname, 'problems-data.json');
const DESC_PATH = path.join(__dirname, 'problem-descriptions.json');
const RESULT_PATH = path.join(__dirname, 'problem-tags.json');

type RawProblem = {
  programmersId: number;
  title: string;
  level: number;
  source: string;
  link: string;
};

type TagResult = { tags: string[] };
type ResultCache = Record<string, TagResult>; // programmersId -> result

const SYSTEM_PROMPT = `당신은 알고리즘 코딩테스트 전문가입니다. 프로그래머스 문제를 읽고, 해당 문제를 풀기 위해 필요한 알고리즘/자료구조 태그를 고정된 목록에서 선택합니다.

다음 규칙을 반드시 지키세요:
1. 반드시 아래 taxonomy 목록 안에서만 태그를 선택합니다. 목록에 없는 이름은 절대 출력하지 마세요.
2. 한 문제당 태그는 **1개 이상 3개 이하**로 선택합니다.
3. 가장 핵심적인(문제 해결에 필수적인) 태그를 우선적으로 선택합니다.
4. 단순 구현으로 풀 수 있는 문제는 "구현" 하나만 선택하세요.
5. 자료구조(스택/큐/우선순위큐/해시 등)는 해당 자료구조가 풀이의 핵심일 때만 선택하세요.
6. 출력은 반드시 JSON 객체 하나. 설명/주석 없이.

# Taxonomy (이 목록 외의 이름 금지)
${TAGS.map((t) => `- ${t}`).join('\n')}

# 태그 정의 참고
- 구현: 특별한 알고리즘 없이 문제 요구사항을 그대로 코드화
- 시뮬레이션: 주어진 규칙대로 상태를 단계적으로 갱신
- 완전탐색: 모든 경우를 탐색 (brute force, 조합/순열 포함)
- 백트래킹: 조건 불만족 시 가지치기하며 탐색
- 분할정복: 문제를 작게 나누어 재귀적으로 해결
- DFS/BFS: 그래프/트리/격자 탐색
- DP: 부분 문제의 최적해로 전체 해를 구성
- 이분탐색: 정렬된 범위에서 log 탐색, 파라메트릭 서치 포함
- 투포인터/슬라이딩윈도우: 구간 이동하며 답 갱신
- 누적합: prefix sum 활용
- 우선순위큐: heap 기반 최소/최대 추출이 핵심
- 해시: dict/set 으로 O(1) 조회가 핵심
- 유니온파인드: disjoint set
- 최단경로: 다익스트라/벨만포드/플로이드
- 비트마스킹: 집합을 비트로 표현

# 출력 형식
{"tags": ["DP", "이분탐색"]}`;

function loadCache(p: string): ResultCache {
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function saveCache(p: string, cache: ResultCache) {
  fs.writeFileSync(p, JSON.stringify(cache, null, 2), 'utf-8');
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max) + '\n...(이하 생략)';
}

async function classify(
  title: string,
  description: string,
  level: number,
): Promise<string[]> {
  const userContent = `# 문제 정보
- 제목: ${title}
- 프로그래머스 레벨: ${level}

# 문제 본문
${truncate(description, 4000)}

위 문제에 가장 적합한 알고리즘 태그를 JSON으로 출력하세요.`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 256,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: userContent }],
  });

  const text =
    response.content[0].type === 'text' ? response.content[0].text : '';
  const match = text.match(/\{[\s\S]*?\}/);
  if (!match) throw new Error(`JSON 응답 파싱 실패: ${text.slice(0, 200)}`);
  const parsed = JSON.parse(match[0]) as TagResult;
  if (!Array.isArray(parsed.tags))
    throw new Error(`tags 배열 없음: ${text.slice(0, 200)}`);

  // taxonomy 검증
  const invalid = parsed.tags.filter((t) => !TAGS.includes(t));
  if (invalid.length > 0) {
    console.warn(`    ⚠️  taxonomy 외 태그 무시: ${invalid.join(', ')}`);
  }
  const valid = parsed.tags.filter((t) => TAGS.includes(t));
  if (valid.length === 0)
    throw new Error(`유효 태그 0개: ${JSON.stringify(parsed.tags)}`);
  return valid.slice(0, 3);
}

async function writeTagsToDb(results: ResultCache) {
  console.log('\n💾 DB에 ProblemTag upsert 중...');

  // 태그 이름 -> id 매핑
  const allTags = await prisma.algorithmTag.findMany();
  const nameToId = new Map(allTags.map((t) => [t.name, t.id]));

  // link -> problem id 매핑 (programmersId 는 DB 에 없으므로 link 로 매칭)
  const allProblems = await prisma.problem.findMany({
    select: { id: true, link: true },
  });
  const linkToId = new Map(allProblems.map((p) => [p.link, p.id]));

  const problems: RawProblem[] = JSON.parse(
    fs.readFileSync(DATA_PATH, 'utf-8'),
  );
  let upserted = 0;
  let skipped = 0;

  for (const p of problems) {
    const result = results[String(p.programmersId)];
    if (!result) {
      skipped++;
      continue;
    }
    const problemId = linkToId.get(p.link);
    if (!problemId) {
      skipped++;
      continue;
    }

    await prisma.problemTag.deleteMany({ where: { problemId } });
    await prisma.problemTag.createMany({
      data: result.tags
        .map((name) => nameToId.get(name))
        .filter((id): id is number => id != null)
        .map((tagId) => ({ problemId, tagId })),
      skipDuplicates: true,
    });
    upserted++;
  }

  console.log(`✓ ProblemTag upsert 완료: ${upserted}개 (스킵 ${skipped}개)`);
}

async function main() {
  console.log('======================================');
  console.log('  AI 알고리즘 태그 분류 배치');
  console.log(`  Model: ${MODEL}`);
  console.log('======================================\n');

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY 환경변수가 필요합니다');
  }

  const problems: RawProblem[] = JSON.parse(
    fs.readFileSync(DATA_PATH, 'utf-8'),
  );
  const descriptions: Record<string, string> = JSON.parse(
    fs.readFileSync(DESC_PATH, 'utf-8'),
  );
  const cache = loadCache(RESULT_PATH);

  const todo = problems.filter((p) => {
    const key = String(p.programmersId);
    return descriptions[key] && !cache[key];
  });

  console.log(
    `📊 전체 ${problems.length}개, 본문 있음 ${Object.keys(descriptions).length}개, 캐시 ${Object.keys(cache).length}개, 분류 대상 ${todo.length}개\n`,
  );

  if (todo.length === 0) {
    console.log('✅ 이미 모두 분류됨, DB 반영만 실행');
    await writeTagsToDb(cache);
    return;
  }

  const totalIn = 0;
  const totalOut = 0;
  const totalCached = 0;
  let success = 0;
  let failed = 0;
  const SAVE_EVERY = 20;

  try {
    for (let i = 0; i < todo.length; i++) {
      const p = todo[i];
      const key = String(p.programmersId);
      process.stdout.write(
        `🔎 [${i + 1}/${todo.length}] ${p.title.slice(0, 40)}... `,
      );

      try {
        const tags = await classify(p.title, descriptions[key], p.level);
        cache[key] = { tags };
        success++;
        process.stdout.write(`✓ [${tags.join(', ')}]\n`);
      } catch (e: any) {
        failed++;
        process.stdout.write(`✗ ${e.message}\n`);
      }

      if ((i + 1) % SAVE_EVERY === 0) {
        saveCache(RESULT_PATH, cache);
        process.stdout.write(
          `  💾 중간 저장 (${Object.keys(cache).length}개)\n`,
        );
      }
    }
  } finally {
    saveCache(RESULT_PATH, cache);
  }

  console.log(`\n📊 AI 호출 결과: 성공 ${success}, 실패 ${failed}`);
  console.log(`💾 결과 저장: ${RESULT_PATH}`);

  await writeTagsToDb(cache);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
