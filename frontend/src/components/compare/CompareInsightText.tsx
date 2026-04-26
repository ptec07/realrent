interface CompareInsightTextProps {
  insight: string
}

export default function CompareInsightText({ insight }: CompareInsightTextProps) {
  return (
    <section className="result-panel" aria-labelledby="compare-insight-heading">
      <h2 id="compare-insight-heading">비교 인사이트</h2>
      <p>{insight}</p>
    </section>
  )
}
