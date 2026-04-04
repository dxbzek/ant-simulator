import Terrain from './components/world/Terrain'
import Skybox from './components/world/Skybox'
import Lighting from './components/world/Lighting'
import Weather from './components/world/Weather'
import Vegetation from './components/world/Vegetation'
import Water from './components/world/Water'
import ResourceNodes from './components/world/ResourceNodes'
import Player from './components/entities/Player'
import PlayerHands from './components/entities/PlayerHands'
import EnemyManager from './components/entities/EnemyManager'
import ColonyBase from './components/buildings/ColonyBase'
import DamageNumbers from './components/ui/DamageNumbers'
import { FPSTracker } from './components/ui/FPSCounter'

export default function Game() {
  return (
    <>
      <FPSTracker />
      <Skybox />
      <Lighting />
      <Terrain />
      <Water />
      <Vegetation />
      <ResourceNodes />
      <Weather />
      <ColonyBase />
      <EnemyManager />
      <DamageNumbers />
      <Player />
      <PlayerHands />
    </>
  )
}
