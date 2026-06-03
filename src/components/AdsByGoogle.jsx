import { useEffect, useMemo } from 'react'

export function AdsByGoogle() {
  const region = useMemo(() => `page-${Math.random()}`, [])

  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {}
  }, [])

  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block', backgroundColor: 'transparent' }}
      data-ad-client="ca-pub-6834090314855499"
      data-ad-format="auto"
      data-ad-region={region}
    />
  )
}
