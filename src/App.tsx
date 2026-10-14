import { useGame } from './state/store'
import { TitleScreen } from './ui/TitleScreen'
import { NewLifeScreen } from './ui/NewLifeScreen'
import { GameScreen } from './ui/GameScreen'
import { TombstoneScreen } from './ui/TombstoneScreen'
import { EscapeMaze, Minesweeper } from './ui/MiniGames'

export default function App() {
  const screen = useGame((s) => s.screen)
  const life = useGame((s) => s.life)
  const minigame = useGame((s) => s.minigame)
  const finishEscape = useGame((s) => s.finishEscape)
  const finishDeployment = useGame((s) => s.finishDeployment)
  if (minigame?.kind === 'maze') return <EscapeMaze seed={minigame.seed} onDone={finishEscape} />
  if (minigame?.kind === 'mines') return <Minesweeper seed={minigame.seed} onDone={finishDeployment} />
  if (screen === 'setup') return <NewLifeScreen />
  if (screen === 'game' && life) return <GameScreen />
  if (screen === 'tombstone' && life) return <TombstoneScreen />
  return <TitleScreen />
}
