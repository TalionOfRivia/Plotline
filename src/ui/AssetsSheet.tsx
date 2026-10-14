import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGame } from '../state/store'
import { Row, Section, Sheet } from './Sheet'
import { ASSETS, ASSET_BY_ID, sysText } from '../engine/systems'
import { netWorth } from '../engine/assets'
import { formatMoney } from './money'
import { useState as useS } from 'react'
import { LOAN_RATE, maxLoan } from '../engine/extras'

const PET_GROUP: Record<string, 'shelter' | 'store' | 'breeder' | 'exotic' | 'ranch'> = { goldfish: 'store', hamster: 'store', rabbit: 'store', rescue_dog: 'shelter', rescue_cat: 'shelter', cat: 'breeder', dog: 'breeder', parrot: 'exotic', snake: 'exotic', pig: 'exotic', tortoise: 'exotic', horse: 'ranch' }

type Tab = 'owned' | 'houses' | 'cars' | 'pets' | 'luxury' | 'money'

export function AssetsSheet() {
  const { t, i18n } = useTranslation()
  const life = useGame((s) => s.life)!
  const { buy, sell, adoptPet } = useGame()
  const [tab, setTab] = useState<Tab>('owned')
  const lang = i18n.language
  const tabs: Tab[] = ['owned', 'money', 'houses', 'cars', 'pets', 'luxury']
  const pets = life.people.filter((p) => p.kind === 'pet' && p.alive)

  return (
    <Sheet title={t('nav.assets')} emoji="🏠">
      <div className="bg-card rounded-2xl p-3 mb-3 shadow-sm flex justify-between text-sm">
        <span>{t('assets.cash')}: <b>{formatMoney(life.money, lang)}</b></span>
        <span>{t('assets.netWorth')}: <b>{formatMoney(netWorth(life), lang)}</b></span>
      </div>
      <div className="flex gap-1 mb-3 overflow-x-auto">
        {tabs.map((k) => (
          <button key={k} onClick={() => setTab(k)} className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${tab === k ? 'bg-chrome text-chrome-fg' : 'bg-card'}`}>{t(`assets.tab.${k}`)}</button>
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

      {tab === 'money' && <MoneyTab />}

      {tab === 'pets' && (
        <>{(['shelter', 'store', 'breeder', 'exotic', 'ranch'] as const).map((grp) => (
        <Section key={grp} title={t(`assets.petGroup.${grp}`)}>
          {ASSETS.pets.filter((a) => PET_GROUP[a.id] === grp).map((a) => (
            <Row key={a.id} emoji={a.emoji} title={sysText(lang, 'assets', `pets.${a.id}`)} sub={`${t('assets.upkeep')} ${formatMoney(a.upkeep, lang)}/${t('work.yr')}`}
              right={formatMoney(a.price, lang)} onClick={() => adoptPet(a.id)} disabled={life.money < a.price || life.age < 6} />
          ))}
        </Section>
        ))}</>
      )}
    </Sheet>
  )
}

/** Finances, investments and loans. */
function MoneyTab() {
  const { t, i18n } = useTranslation()
  const life = useGame((s) => s.life)!
  const g = useGame()
  const lang = i18n.language
  const [amt, setAmt] = useS(1000)
  const fmt = (n: number) => formatMoney(n, lang)
  const inv = life.investments
  return (
    <>
      <Section title={t('fin.overview')}>
        <div className="bg-card rounded-2xl p-4 shadow-sm text-sm grid grid-cols-2 gap-y-1">
          <span>{t('fin.salary')}</span><b className="text-end">{fmt(life.job?.salary ?? 0)}</b>
          <span>{t('fin.pension')}</span><b className="text-end">{fmt(life.pension)}</b>
          <span>{t('fin.assets')}</span><b className="text-end">{fmt(life.assets.reduce((s, a) => s + a.value, 0))}</b>
          <span>{t('fin.mortgages')}</span><b className="text-end text-bad">{fmt(-life.assets.reduce((s, a) => s + a.mortgage, 0))}</b>
          <span>{t('fin.loan')}</span><b className="text-end text-bad">{fmt(-life.loan)}</b>
          <span>{t('fin.studentLoans')}</span><b className="text-end text-bad">{fmt(-life.education.loans)}</b>
          <span>{t('fin.investments')}</span><b className="text-end">{fmt(inv.index + inv.crypto)}</b>
        </div>
      </Section>
      <Section title={t('fin.amount')}>
        <div className="flex gap-1 mb-2">
          {[500, 1000, 5000, 25000, 100000].map((n) => (
            <button key={n} onClick={() => setAmt(n)} className={`flex-1 py-2 rounded-xl text-xs font-semibold ${amt === n ? 'bg-chrome text-chrome-fg' : 'bg-card'}`}>{fmt(n)}</button>
          ))}
        </div>
      </Section>
      <Section title={t('fin.investTitle')}>
        <p className="text-xs opacity-70 px-1 mb-2">{t('fin.investHint')}</p>
        <Row emoji="📈" title={t('fin.index')} sub={`${t('fin.held')} ${fmt(inv.index)}`} right={`+${fmt(amt)}`} onClick={() => g.invest('index', amt)} disabled={life.money < amt || life.age < 18} />
        {inv.index > 0 && <Row emoji="💵" title={t('fin.sellIndex')} right={`-${fmt(Math.min(amt, inv.index))}`} onClick={() => g.withdraw('index', amt)} />}
        <Row emoji="🪙" title={t('fin.crypto')} sub={`${t('fin.held')} ${fmt(inv.crypto)}`} right={`+${fmt(amt)}`} onClick={() => g.invest('crypto', amt)} disabled={life.money < amt || life.age < 18} />
        {inv.crypto > 0 && <Row emoji="💵" title={t('fin.sellCrypto')} right={`-${fmt(Math.min(amt, inv.crypto))}`} onClick={() => g.withdraw('crypto', amt)} />}
      </Section>
      <Section title={t('fin.loanTitle')}>
        <p className="text-xs opacity-70 px-1 mb-2">{t('fin.loanHint', { pct: Math.round(LOAN_RATE * 100), max: fmt(maxLoan(life)) })}</p>
        <Row emoji="🏦" title={t('fin.borrow')} right={`+${fmt(Math.min(amt, maxLoan(life)))}`} onClick={() => g.takeLoan(amt)} disabled={maxLoan(life) <= 0 || life.age < 18} />
        {life.loan > 0 && <Row emoji="✅" title={t('fin.repay')} sub={`${t('fin.owed')} ${fmt(life.loan)}`} right={`-${fmt(Math.min(amt, life.loan, Math.max(0, life.money)))}`} onClick={() => g.repayLoan(amt)} disabled={life.money <= 0} />}
      </Section>
    </>
  )
}
