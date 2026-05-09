/**
 * 프로그래머스 문제 본문 스크래핑
 * 실행: npm run scrape-descriptions
 *
 * problems-data.json 의 각 URL 을 puppeteer 로 열어서
 * 문제 설명을 추출하고 problem-descriptions.json 에 캐싱한다.
 * 이미 캐싱된 문제는 건너뛴다 (idempotent).
 */
import puppeteer, { Browser } from 'puppeteer'
import * as fs from 'fs'
import * as path from 'path'

type RawProblem = {
  programmersId: number
  title: string
  level: number
  source: string
  partTitle: string
  link: string
  acceptanceRate: number | null
}

type DescriptionCache = Record<string, string> // programmersId -> 본문 텍스트

const DATA_PATH = path.join(__dirname, 'problems-data.json')
const CACHE_PATH = path.join(__dirname, 'problem-descriptions.json')

function loadCache(): DescriptionCache {
  if (!fs.existsSync(CACHE_PATH)) return {}
  return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'))
}

function saveCache(cache: DescriptionCache) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf-8')
}

async function extractDescription(browser: Browser, url: string): Promise<string> {
  const page = await browser.newPage()
  try {
    await page.setUserAgent(
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    )
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 })

    // 문제 설명 컨테이너: 프로그래머스는 guide 또는 markdown 영역에 렌더링
    await page.waitForSelector('.guide-section, .markdown, [class*="problem"]', { timeout: 15_000 })

    const text = await page.evaluate(() => {
      const selectors = [
        '.guide-section .markdown',
        '.guide-section',
        '.markdown',
        '#tour',
        'section.problem',
      ]
      for (const sel of selectors) {
        const el = document.querySelector(sel) as HTMLElement | null
        if (el && el.innerText.trim().length > 50) return el.innerText
      }
      // fallback: main 영역 전체 텍스트
      const main = document.querySelector('main') as HTMLElement | null
      return main?.innerText ?? ''
    })

    return text.trim()
  } finally {
    await page.close()
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  console.log('======================================')
  console.log('  프로그래머스 문제 본문 스크래퍼')
  console.log('======================================\n')

  const problems: RawProblem[] = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'))
  const cache = loadCache()

  const todo = problems.filter((p) => !cache[String(p.programmersId)])
  console.log(`📊 전체 ${problems.length}개, 캐시 ${Object.keys(cache).length}개, 스크래핑 대상 ${todo.length}개\n`)

  if (todo.length === 0) {
    console.log('✅ 이미 모두 캐싱됨')
    return
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  let success = 0
  let failed = 0
  const SAVE_EVERY = 10
  const DELAY_MS = 1200

  try {
    for (let i = 0; i < todo.length; i++) {
      const p = todo[i]
      const idKey = String(p.programmersId)
      process.stdout.write(`⬇️  [${i + 1}/${todo.length}] ${p.title.slice(0, 40)}... `)

      try {
        const text = await extractDescription(browser, p.link)
        if (text.length < 30) throw new Error(`본문 너무 짧음 (${text.length}자)`)
        cache[idKey] = text
        success++
        process.stdout.write(`✓ ${text.length}자\n`)
      } catch (e: any) {
        failed++
        process.stdout.write(`✗ ${e.message}\n`)
      }

      if ((i + 1) % SAVE_EVERY === 0) {
        saveCache(cache)
      }

      if (i < todo.length - 1) await sleep(DELAY_MS)
    }
  } finally {
    saveCache(cache)
    await browser.close()
  }

  console.log(`\n✅ 완료! 성공 ${success}개, 실패 ${failed}개`)
  console.log(`💾 캐시 저장: ${CACHE_PATH}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
