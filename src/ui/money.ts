export function formatMoney(n: number, lang: string) {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1e9).toFixed(1)}B`
  if (abs >= 1_000_000) return `${sign}$${(abs / 1e6).toFixed(1)}M`
  if (abs >= 10_000) return `${sign}$${Math.round(abs / 1000)}K`
  return `${sign}$${abs.toLocaleString(lang === 'he' ? 'he-IL' : 'en-US')}`
}
