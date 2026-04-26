import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'globals.css'), 'utf8')

describe('mobile responsive styles', () => {
  it('keeps the MVP usable on narrow screens', () => {
    expect(css).toContain('@media (max-width: 640px)')
    expect(css).toMatch(/\.search-card[\s\S]*box-shadow:\s*0 18px 48px/)
    expect(css).toMatch(/\.filter-grid,\s*\n\s*\.budget-panel,\s*\n\s*\.compare-picker[\s\S]*grid-template-columns:\s*1fr/)
    expect(css).toMatch(/\.summary-grid,\s*\n\s*\.compare-summary-grid[\s\S]*grid-template-columns:\s*1fr/)
    expect(css).toMatch(/\.transaction-card[\s\S]*overflow-wrap:\s*anywhere/)
    expect(css).toMatch(/\.trend-list[\s\S]*overflow-x:\s*auto/)
    expect(css).toMatch(/\.toggle-option span[\s\S]*justify-content:\s*center/)
  })
})
