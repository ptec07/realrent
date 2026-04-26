interface BudgetFilterPanelProps {
  depositMax: string
  monthlyRentMax: string
  onDepositMaxChange: (value: string) => void
  onMonthlyRentMaxChange: (value: string) => void
}

export default function BudgetFilterPanel({
  depositMax,
  monthlyRentMax,
  onDepositMaxChange,
  onMonthlyRentMaxChange,
}: BudgetFilterPanelProps) {
  return (
    <div className="budget-panel">
      <label className="field-group" htmlFor="deposit-max">
        <span>보증금 상한</span>
        <input
          id="deposit-max"
          inputMode="numeric"
          name="depositMax"
          placeholder="예: 12000"
          type="number"
          value={depositMax}
          onChange={(event) => onDepositMaxChange(event.target.value)}
        />
      </label>
      <label className="field-group" htmlFor="monthly-rent-max">
        <span>월세 상한</span>
        <input
          id="monthly-rent-max"
          inputMode="numeric"
          name="monthlyRentMax"
          placeholder="예: 70"
          type="number"
          value={monthlyRentMax}
          onChange={(event) => onMonthlyRentMaxChange(event.target.value)}
        />
      </label>
    </div>
  )
}
