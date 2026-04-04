import { useEffect, useState } from 'react'
import { useWorldStore } from '../../stores/worldStore'

const BIOME_NAMES: Record<string, string> = {
  forest: 'Forest Floor',
  garden: 'Backyard Garden',
  cave: 'Underground Cave',
  desert: 'Sandy Wastes',
  swamp: 'Toxic Swamp',
}

export default function BiomeIndicator() {
  const biome = useWorldStore((s) => s.currentBiome)
  const [visible, setVisible] = useState(false)
  const [displayBiome, setDisplayBiome] = useState(biome)

  useEffect(() => {
    setDisplayBiome(biome)
    setVisible(true)
    const timer = setTimeout(() => setVisible(false), 3000)
    return () => clearTimeout(timer)
  }, [biome])

  return (
    <div
      className={`fixed top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-all duration-700 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
    >
      <div className="bg-black/60 backdrop-blur-sm rounded-lg px-6 py-2 border border-white/20">
        <p className="text-white/90 text-lg font-semibold text-center tracking-wide">
          {BIOME_NAMES[displayBiome] || displayBiome}
        </p>
      </div>
    </div>
  )
}
