interface CompareInsightTextProps {
  insight: string
}

export default function CompareInsightText({ insight }: CompareInsightTextProps) {
  const sanitizedInsight = insight
    .replace(/\b\d{5}\s*지역은\s*\d{5}\s*지역보다/g, '비교 지역은 기준 지역보다')
    .replace(/\b\d{5}\s*지역/g, '해당 지역')

  return (
    <section className="result-panel" aria-labelledby="compare-insight-heading">
      <h2 id="compare-insight-heading">비교 인사이트</h2>
      <p>{sanitizedInsight}</p>
    </section>
  )
}
