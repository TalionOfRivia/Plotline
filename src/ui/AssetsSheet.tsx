import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGame } from '../state/store'
import { Row, Section, Sheet } from './Sheet'
import { ASSETS, ASSET_BY_ID, sysText } from '../engine/systems'
import { netWorth } from '../engine/assets'
import { formatMoney } from './money'

type Tab = 'owned' | 'houses' | 'cars' | 'pets' | 'luxury'

export function AssetsSheet() {
  const { t, i18n } = useTranslation()
  const life = useGame((s) => s.life)!
  const { buy, sell, adoptPet } = useGame()
  const [tab, setTab] = useState<Tab>('owned')
  const lang = i18n.language
  const tabs: Tab[] = ['owned', 'houses', 'cars', 'pets', 'luxury']
  const pets = life.people.filter((p) => p.kind === 'pet' && p.alive)

  return (
    <Sheet title={t('nav.assets')} emoji="🏠">
      <div className="bg-paper rounded-2xl p-3 mb-3 shadow-sm flex justify-between text-sm">
        <span>{t('assets.cash')}: <b>{formatMoney(life.money, lang)}</b></span>
        <span>{t('assets.netWorth')}: <b>{formatMoney(netWorth(life), lang)}</b></span>
      </div>
      <div className="flex gap-1 mb-3 overflow-x-auto">
        {tabs.map((k) => (
          <button key={k} onClick={() => setTab(k)} className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${tab === k ? 'bg-ink text-cream' : 'bg-paper'}`}>{t(`assets.tab.${k}`)}</button>
        ))}
      </div>

      {tab === 'owned' && (
        <>
          {life.assets.length === 0 && pets.length === 0 && <p className="text-sm opacity-60 px-1">{t('assets.none')}</p>}
          {life.assets.map((a) => {
            const def = ASSET_BY_ID[a.assetId]
            return (
              <Row key={a.id} emoji={def?.emoji ?? '📦'} title={sysText(lang, 'assets', `${def.kind === 'house' ? 'houses' : def.kind === 'car' ? 'cars' : 'luxury'}.${a.assetId}`)}
                sub={<>{t('assets.value')} {formatMoney(a.value, lang)}{a.mortgage > 0 && <> · {t('assets.mortgage')} {formatMoney(a.mortgage, lang)}</>}{a.kind === 'car' && <> · {t('assets.condition')} {Math.round(a.condition)}%</>}</>}
                right={t('assets.sell')} onClick={() => sell(a.id)} />
            )
          })}
          {pets.map((p) => {
            const def = ASSET_BY_ID[p.species ?? '']
            return <Row key={p.id} emoji={def?.emoji ?? '🐾'} title={p.firstName} sub={`${sysText(lang, 'assets', `pets.${p.species}`)} · ${t('common.age', { age: p.age })}`} />
          })}
        </>
      )}

      {(tab === 'houses' || tab === 'cars' || tab === 'luxury') && (
        <Section title={t('assets.shop')}>
          {ASSETS[tab].map((a) => (
            <Row key={a.id} emoji={a.emoji} title={sysText(lang, 'assets', `${tab}.${a.id}`)}
              sub={<>{t('assets.upkeep')} {formatMoney(a.upkeep, lang)}/{t('work.yr')}{tab === 'houses' && <> · {t('assets.mortgageHint', { money: formatMoney(Math.round(a.price * 0.2), lang) })}</>}</>}
              right={formatMoney(a.price, lang)}
              onClick={() => buy(a.id, tab === 'houses' && life.money < a.price)}
              disabled={life.age < 18 || life.money < (tab === 'houses' ? a.price * 0.2 : a.price)} />
          ))}
        </Section>
      )}

      {tab === 'pets' && (
        <Section title={t('assets.adopt')}>
          {ASSETS.pets.map((a) => (
            <Row key={a.id} emoji={a.emoji} title={sysText(lang, 'assets', `pets.${a.id}`)} sub={`${t('assets.upkeep')} ${formatMoney(a.upkeep, lang)}/${t('work.yr')}`}
              right={formatMoney(a.price, lang)} onClick={() => adoptPet(a.id)} disabled={life.money < a.price || life.age < 6} />
          ))}
        </Section>
      )}
    </Sheet>
  )
}
