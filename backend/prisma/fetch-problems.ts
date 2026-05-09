/**
 * 프로그래머스 전체 문제 데이터 수집 스크립트
 * 실행: npm run fetch-problems
 *
 * 프로그래머스 내부 API를 직접 호출해 전체 문제 목록을 JSON으로 저장
 * 이후 npm run seed 로 DB에 반영
 */
import * as https from 'https'
import * as fs from 'fs'
import * as path from 'path'

// ─── 출처 매핑 ────────────────────────────────────────────────
type ProblemSource =
  | 'PRACTICE' | 'KAKAO_BLIND' | 'KAKAO_INTERNSHIP' | 'KAKAO_CODE'
  | 'MONTHLY_CHALLENGE' | 'WEEKLY_CHALLENGE' | 'SUMMER_WINTER'
  | 'PCCE' | 'PCCP' | 'SQL' | 'OTHER'

const SOURCE_RULES: { keywords: string[]; source: ProblemSource }[] = [
  { keywords: ['KAKAO BLIND', '카카오 블라인드', 'KAKAO BLIND RECRUITMENT'], source: 'KAKAO_BLIND' },
  { keywords: ['카카오 채용연계형 인턴십', 'KAKAO TECH INTERNSHIP', 'KAKAO WINTER INTERNSHIP', '카카오 개발자 겨울 인턴십', '카카오 인턴십', '2020 카카오 인턴십', '2021 카카오 채용연계형'], source: 'KAKAO_INTERNSHIP' },
  { keywords: ['카카오코드', '2025 카카오 하반기'], source: 'KAKAO_CODE' },
  { keywords: ['월간 코드 챌린지', '프로그래머스 코드챌린지'], source: 'MONTHLY_CHALLENGE' },
  { keywords: ['위클리 챌린지'], source: 'WEEKLY_CHALLENGE' },
  { keywords: ['Summer/Winter Coding'], source: 'SUMMER_WINTER' },
  { keywords: ['PCCE'], source: 'PCCE' },
  { keywords: ['PCCP'], source: 'PCCP' },
  { keywords: ['SELECT', 'GROUP BY', 'JOIN', 'IS NULL', 'SUM, MAX, MIN', 'String, Date'], source: 'SQL' },
  { keywords: ['연습문제', '코딩 기초 트레이닝', '코딩테스트 입문', '완전탐색', '정렬', '스택/큐', '해시', '힙(Heap)', '깊이/너비 우선 탐색', '동적계획법', '탐욕법', '이분탐색', '그래프'], source: 'PRACTICE' },
]

function inferSource(partTitle: string): ProblemSource {
  const upper = partTitle.toUpperCase()
  for (const rule of SOURCE_RULES) {
    if (rule.keywords.some((k) => upper.includes(k.toUpperCase()))) {
      return rule.source
    }
  }
  return 'OTHER'
}

// ─── HTTP GET 유틸 ────────────────────────────────────────────
function get(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://school.programmers.co.kr/learn/challenges',
      },
    }
    https.get(url, options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch (e) { reject(new Error(`JSON 파싱 실패: ${data.slice(0, 200)}`)) }
      })
    }).on('error', reject)
  })
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

// ─── 메인 ────────────────────────────────────────────────────
async function main() {
  console.log('======================================')
  console.log('  프로그래머스 문제 데이터 수집기')
  console.log('======================================\n')

  const BASE = 'https://school.programmers.co.kr/api/v2/school/challenges/'

  // 1페이지로 전체 수 확인
  const firstPage = await get(`${BASE}?perPage=100&page=1&order=recent`)
  const totalPages: number = firstPage.totalPages
  const totalEntries: number = firstPage.totalEntries
  console.log(`📊 총 ${totalEntries}개 문제, ${totalPages}페이지\n`)

  const allRaw: any[] = []

  for (let page = 1; page <= totalPages; page++) {
    process.stdout.write(`⬇️  페이지 ${page}/${totalPages} 수집 중...`)
    const data = await get(`${BASE}?perPage=100&page=${page}&order=recent`)
    allRaw.push(...data.result)
    process.stdout.write(` ${data.result.length}개 (누적: ${allRaw.length})\n`)
    if (page < totalPages) await sleep(400) // 서버 부하 방지
  }

  // 파싱
  const problems = allRaw.map((item) => ({
    programmersId: item.id,
    title: item.title,
    level: item.level ?? 0,
    source: inferSource(item.partTitle ?? ''),
    partTitle: item.partTitle ?? '',
    link: `https://school.programmers.co.kr/learn/courses/30/lessons/${item.id}`,
    acceptanceRate: item.acceptanceRate ?? null,
  }))

  // 출처 분포 출력
  console.log('\n📦 출처별 분포:')
  const sourceCount = problems.reduce((acc, p) => {
    acc[p.source] = (acc[p.source] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)
  Object.entries(sourceCount).sort((a, b) => b[1] - a[1]).forEach(([s, c]) => {
    console.log(`  ${s}: ${c}개`)
  })

  console.log('\n📊 레벨별 분포:')
  ;[0,1,2,3,4,5].forEach((l) => {
    const c = problems.filter((p) => p.level === l).length
    console.log(`  Lv.${l}: ${c}개`)
  })

  // 매핑 안 된 partTitle 확인
  const otherTitles = [...new Set(problems.filter(p => p.source === 'OTHER').map(p => p.partTitle))]
  if (otherTitles.length > 0) {
    console.log('\n⚠️  OTHER로 분류된 partTitle:')
    otherTitles.forEach(t => console.log(`  - ${t}`))
  }

  // 저장
  const outputPath = path.join(__dirname, 'problems-data.json')
  fs.writeFileSync(outputPath, JSON.stringify(problems, null, 2), 'utf-8')
  console.log(`\n✅ 총 ${problems.length}개 저장 완료: ${outputPath}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
