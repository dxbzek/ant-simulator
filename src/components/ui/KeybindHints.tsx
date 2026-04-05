import { useSettingsStore } from '../../stores/settingsStore'
import type { KeybindConfig } from '../../data/keybinds'

const HINT_ACTIONS: { action: keyof KeybindConfig; label: string }[] = [
  { action: 'inventory', label: 'Inventory' },
  { action: 'buildMenu', label: 'Build' },
  { action: 'craftMenu', label: 'Craft' },
  { action: 'researchMenu', label: 'Research' },
  { action: 'questLog', label: 'Quests' },
  { action: 'useItem', label: 'Use Item' },
  { action: 'diplomacyMenu', label: 'Diplomacy' },
]

function formatKey(code: string): string {
  return code.replace('Key', '').replace('Digit', '')
}

export default function KeybindHints() {
  const keybinds = useSettingsStore((s) => s.keybinds)

  return (
    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 pointer-events-none">
      <div className="flex gap-2 bg-black/30 rounded-lg px-2 py-1">
        {HINT_ACTIONS.map((h) => (
          <div key={h.action} className="flex items-center gap-0.5">
            <span className="text-amber-400/60 text-[9px] font-mono bg-white/5 rounded px-1">{formatKey(keybinds[h.action])}</span>
            <span className="text-white/30 text-[8px]">{h.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
