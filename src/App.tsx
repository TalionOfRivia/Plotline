import { useGame } from './state/store'
import { TitleScreen } from './ui/TitleScreen'
import { NewLifeScreen } from './ui/NewLifeScreen'
import { GameScreen } from './ui/GameScreen'
import { TombstoneScreen } from './ui/TombstoneScreen'

export default function App() {
  const screen = useGame((s) => s.screen)
  const life = useGame((s) => s.life)
  if (screen === 'setup') return <NewLifeScreen />
  if (screen === 'game' && life) return <GameScreen />
  if (screen === 'tombstone' && life) return <TombstoneScreen />
  return <TitleScreen />
}
