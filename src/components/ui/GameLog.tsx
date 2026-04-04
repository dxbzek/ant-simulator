import { useGameLogStore } from '../../stores/gameStore'

export default function GameLog() {
  const messages = useGameLogStore((s) => s.messages)

  if (messages.length === 0) return null

  return (
    <div className="fixed bottom-20 left-4 z-20 pointer-events-none max-w-[300px]">
      <div className="flex flex-col gap-0.5">
        {messages.slice(-5).map((msg) => (
          <div
            key={msg.id}
            className={`text-[11px] px-2 py-0.5 rounded bg-black/40 transition-opacity duration-500
              ${msg.type === 'combat' ? 'text-red-400' :
                msg.type === 'loot' ? 'text-amber-400' :
                msg.type === 'quest' ? 'text-green-400' :
                msg.type === 'system' ? 'text-blue-400' :
                'text-white/70'}`}
          >
            {msg.text}
          </div>
        ))}
      </div>
    </div>
  )
}
