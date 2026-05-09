import { PrismaClient, ProblemSource } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

dotenv.config()

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

// ─── 알고리즘 태그 (고정 taxonomy) ─────────────────────────────
export const TAGS = [
  '구현', '시뮬레이션', '수학', '정렬', '문자열',
  '완전탐색', '그리디', '백트래킹', '분할정복',
  'DFS', 'BFS', '그래프', '트리', '유니온파인드', '최단경로',
  'DP', '이분탐색', '투포인터', '슬라이딩윈도우', '누적합',
  '스택', '큐', '우선순위큐', '해시',
  '비트마스킹',
]

async function main() {
  console.log('🌱 Seeding started...')

  // 기존 데이터 초기화
  await prisma.problemTag.deleteMany()
  await prisma.algorithmTag.deleteMany()
  await prisma.problem.deleteMany()

  // 태그 생성
  console.log('📌 Creating algorithm tags...')
  for (const name of TAGS) {
    await prisma.algorithmTag.create({ data: { name } })
  }
  console.log(`  ✓ ${TAGS.length}개 태그 생성`)

  // problems-data.json 읽기
  const dataPath = path.join(__dirname, 'problems-data.json')
  if (!fs.existsSync(dataPath)) {
    throw new Error(`problems-data.json을 찾을 수 없습니다. 먼저 npm run fetch-problems를 실행하세요.\n경로: ${dataPath}`)
  }

  const rawProblems: {
    programmersId: number
    title: string
    level: number
    source: string
    partTitle: string
    link: string
    acceptanceRate: number | null
  }[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))

  console.log(`📝 Creating ${rawProblems.length} problems...`)

  // 배치 단위로 삽입 (로그 출력용)
  const BATCH = 50
  let created = 0

  for (let i = 0; i < rawProblems.length; i += BATCH) {
    const batch = rawProblems.slice(i, i + BATCH)
    await prisma.problem.createMany({
      data: batch.map((p) => ({
        title: p.title,
        source: p.source as ProblemSource,
        level: p.level,
        acceptanceRate: p.acceptanceRate,
        link: p.link,
      })),
      skipDuplicates: true,
    })
    created += batch.length
    process.stdout.write(`\r  ✓ ${created}/${rawProblems.length} 완료`)
  }

  console.log(`\n✅ 완료! 태그: ${TAGS.length}개, 문제: ${rawProblems.length}개`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
