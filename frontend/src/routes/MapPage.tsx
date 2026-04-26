import { navigateTo } from '../utils/navigation'

function getMapSearchUrl(address: string) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`
}

function buildReturnUrl(returnTo: string, transactionId: string) {
  const fallback = '/'
  const safeReturnTo = returnTo.startsWith('/results') ? returnTo : fallback
  const url = new URL(safeReturnTo, window.location.origin)
  if (transactionId) {
    url.searchParams.set('focusTransactionId', transactionId)
  }
  return `${url.pathname}${url.search}`
}

export default function MapPage() {
  const params = new URLSearchParams(window.location.search)
  const address = params.get('address')?.trim() ?? ''
  const buildingName = params.get('buildingName')?.trim() ?? ''
  const transactionId = params.get('transactionId')?.trim() ?? ''
  const returnTo = params.get('returnTo')?.trim() ?? ''
  const returnUrl = buildReturnUrl(returnTo, transactionId)

  return (
    <main className="map-shell">
      <section className="map-panel">
        <p className="eyebrow">RealRent Map</p>
        <h1>지도 보기</h1>
        {address ? (
          <>
            {buildingName ? <h2>{buildingName}</h2> : null}
            <p className="lead map-address">{address}</p>
            <iframe
              className="map-frame"
              title={`${address} 지도`}
              src={getMapSearchUrl(address)}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="map-actions">
              <a className="secondary-link" href={returnUrl} onClick={(event) => { event.preventDefault(); navigateTo(returnUrl) }}>
                목록으로 가기
              </a>
              <a className="secondary-link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} target="_blank" rel="noreferrer">
                새 창에서 지도 열기
              </a>
            </div>
          </>
        ) : (
          <p className="empty-state">지도에 표시할 주소가 없습니다.</p>
        )}
      </section>
    </main>
  )
}
