import { chromium } from 'playwright'
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
await page.goto('file:///tmp/claude-0/-home-user-brandportal/094363d0-b907-5049-a609-5c2f2236e9be/scratchpad/basel/Basel Website.dc.html', { waitUntil: 'networkidle' }).catch(()=>{})
await page.waitForTimeout(1500)
await page.screenshot({ path: '/tmp/claude-0/-home-user-brandportal/094363d0-b907-5049-a609-5c2f2236e9be/scratchpad/basel-full.png', fullPage: true })
await browser.close(); console.log('done')
