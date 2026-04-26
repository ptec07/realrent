function getMapSearchUrl(address: string) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`
}

export default function MapPage() {
  const params = new URLSearchParams(window.location.search)
  const address = params.get('address')?.trim() ?? ''
  const buildingName = params.get('buildingName')?.trim() ?? ''

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
            <a className="secondary-link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} target="_blank" rel="noreferrer">
              새 창에서 지도 열기
            </a>
          </>
        ) : (
          <p className="empty-state">지도에 표시할 주소가 없습니다.</p>
        )}
      </section>
    </main>
  )
}
