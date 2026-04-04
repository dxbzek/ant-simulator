import { useEffect, useRef } from 'react'

const keys = new Set<string>()
const justPressed = new Set<string>()

export function useKeyboard() {
  const frameRef = useRef(0)

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (!keys.has(e.code)) {
        justPressed.add(e.code)
      }
      keys.add(e.code)
    }
    const onUp = (e: KeyboardEvent) => {
      keys.delete(e.code)
      justPressed.delete(e.code)
    }
    const onBlur = () => {
      keys.clear()
      justPressed.clear()
    }

    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  return {
    isDown: (code: string) => keys.has(code),
    isJustPressed: (code: string) => {
      if (justPressed.has(code)) {
        justPressed.delete(code)
        return true
      }
      return false
    },
    frame: frameRef,
  }
}

// Singleton access for systems outside React
export function isKeyDown(code: string): boolean {
  return keys.has(code)
}
