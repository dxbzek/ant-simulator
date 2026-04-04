import { useRef, useEffect } from 'react'
import { usePlayerStore } from '../../stores/playerStore'
import { useColonyStore } from '../../stores/colonyStore'
import { useCombatStore } from '../../stores/combatStore'
import { getTerrainHeightAt } from '../world/Terrain'
import { resourceNodesRef } from '../world/ResourceNodes'

const MAP_SIZE = 96
const MAP_SCALE = 2

// Pre-allocated outside render loop
const RES_COLORS: Record<string, string> = {
  food: '#f59e0b', wood: '#8b4513', leaves: '#22c55e', minerals: '#94a3b8', water: '#3b82f6'
}

export default function Minimap() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameCount = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const render = () => {
      frameCount.current++
      if (frameCount.current % 15 !== 0) { // Update every 15 frames (~4 FPS)
        requestAnimationFrame(render)
        return
      }

      const { positionX: px, positionZ: pz, rotationY: rot } = usePlayerStore.getState()

      ctx.clearRect(0, 0, MAP_SIZE, MAP_SIZE)

      // Draw terrain mini-view (lower res for performance)
      const step = 8
      for (let y = 0; y < MAP_SIZE; y += step) {
        for (let x = 0; x < MAP_SIZE; x += step) {
          const worldX = px + (x - MAP_SIZE / 2) / MAP_SCALE
          const worldZ = pz + (y - MAP_SIZE / 2) / MAP_SCALE
          const h = getTerrainHeightAt(worldX, worldZ)
          const brightness = Math.floor(40 + Math.max(0, Math.min(1, (h + 5) / 15)) * 80)
          ctx.fillStyle = `rgb(${brightness >> 1}, ${brightness}, ${(brightness * 0.4) | 0})`
          ctx.fillRect(x, y, step, step)
        }
      }

      // Draw resource nodes (nearby, up to 20)
      const resNodes = resourceNodesRef.current
      let resDrawn = 0
      ctx.globalAlpha = 0.6
      for (const n of resNodes) {
        if (n.amount <= 0) continue
        const rx = MAP_SIZE / 2 + (n.x - px) * MAP_SCALE
        const ry = MAP_SIZE / 2 + (n.z - pz) * MAP_SCALE
        if (rx < 0 || rx >= MAP_SIZE || ry < 0 || ry >= MAP_SIZE) continue
        ctx.fillStyle = RES_COLORS[n.resourceType] || '#fff'
        ctx.fillRect(rx - 1, ry - 1, 2, 2)
        resDrawn++
        if (resDrawn >= 20) break
      }
      ctx.globalAlpha = 1

      // Draw buildings
      const buildings = useColonyStore.getState().buildings
      ctx.fillStyle = '#4ade80'
      for (const b of buildings) {
        const bx = MAP_SIZE / 2 + (b.x - px) * MAP_SCALE
        const by = MAP_SIZE / 2 + (b.z - pz) * MAP_SCALE
        if (bx >= 0 && bx < MAP_SIZE && by >= 0 && by < MAP_SIZE) {
          ctx.fillRect(bx - 2, by - 2, 4, 4)
        }
      }

      // Draw enemies
      const enemies = useCombatStore.getState().enemies
      for (const e of enemies) {
        const ex = MAP_SIZE / 2 + (e.x - px) * MAP_SCALE
        const ey = MAP_SIZE / 2 + (e.z - pz) * MAP_SCALE
        if (ex >= 0 && ex < MAP_SIZE && ey >= 0 && ey < MAP_SIZE) {
          ctx.fillStyle = e.isBoss ? '#f59e0b' : '#ef4444'
          ctx.beginPath()
          ctx.arc(ex, ey, e.isBoss ? 3 : 2, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Draw player
      ctx.save()
      ctx.translate(MAP_SIZE / 2, MAP_SIZE / 2)
      ctx.rotate(-rot)
      ctx.fillStyle = '#60a5fa'
      ctx.beginPath()
      ctx.moveTo(0, -5)
      ctx.lineTo(-3, 4)
      ctx.lineTo(3, 4)
      ctx.closePath()
      ctx.fill()
      ctx.restore()

      requestAnimationFrame(render)
    }

    const id = requestAnimationFrame(render)
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className="fixed bottom-16 right-4 z-20 pointer-events-none">
      <div className="rounded-full overflow-hidden border-2 border-white/20 bg-black/40" style={{ width: MAP_SIZE, height: MAP_SIZE }}>
        <canvas ref={canvasRef} width={MAP_SIZE} height={MAP_SIZE} />
      </div>
    </div>
  )
}
