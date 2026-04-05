import { useRef, useEffect, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { usePlayerStore } from '../../stores/playerStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useGameStore, useGameLogStore } from '../../stores/gameStore'
import { useInventoryStore } from '../../stores/inventoryStore'
import { useKeyboard } from '../../hooks/useKeyboard'
import { getTerrainHeightAt } from '../world/Terrain'
import { GRAVITY, JUMP_FORCE, MOVE_SPEED, SPRINT_MULTIPLIER, CROUCH_MULTIPLIER, SWIM_SPEED, STAMINA_DRAIN_RATE, STAMINA_RECOVER_RATE, WATER_LEVEL, FALL_DAMAGE_THRESHOLD, FALL_DAMAGE_MULTIPLIER, GLIDE_GRAVITY } from '../../systems/movement'
import { clamp } from '../../utils/math'
import { initGame, tickGameLoop, activeEventEffects } from '../../systems/gameLoop'
import { saveGame } from '../../systems/saveLoad'
import { spawnDamageNumber } from '../ui/DamageNumbers'

export default function Player() {
  const { camera, gl } = useThree()
  const keyboard = useKeyboard()

  const velocity = useRef(new THREE.Vector3(0, 0, 0))
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))
  const isLocked = useRef(false)
  const prevGrounded = useRef(true)
  const autoSaveTimer = useRef(0)
  const gameInitialized = useRef(false)

  // Init game on first mount
  useEffect(() => {
    if (!gameInitialized.current) {
      initGame()
      gameInitialized.current = true
    }
  }, [])

  const handleClick = useCallback(() => {
    const screen = useGameStore.getState().screen
    if (screen !== 'playing') return
    gl.domElement.requestPointerLock()
  }, [gl])

  useEffect(() => {
    const onLockChange = () => {
      isLocked.current = document.pointerLockElement === gl.domElement
      useGameStore.getState().setPointerLocked(isLocked.current)
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!isLocked.current) return
      const sensitivity = useSettingsStore.getState().mouseSensitivity
      const invertY = useSettingsStore.getState().invertY

      euler.current.y -= e.movementX * sensitivity
      euler.current.x -= e.movementY * sensitivity * (invertY ? -1 : 1)
      euler.current.x = clamp(euler.current.x, -Math.PI / 2 + 0.01, Math.PI / 2 - 0.01)
    }

    gl.domElement.addEventListener('click', handleClick)
    document.addEventListener('pointerlockchange', onLockChange)
    document.addEventListener('mousemove', onMouseMove)

    return () => {
      gl.domElement.removeEventListener('click', handleClick)
      document.removeEventListener('pointerlockchange', onLockChange)
      document.removeEventListener('mousemove', onMouseMove)
    }
  }, [gl, handleClick])

  // Handle Escape for pointer lock exit and pause
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        const screen = useGameStore.getState().screen
        if (screen === 'playing') {
          if (document.pointerLockElement) {
            document.exitPointerLock()
          }
          useGameStore.getState().togglePause()
        } else if (screen === 'paused') {
          useGameStore.getState().togglePause()
          setTimeout(() => {
            gl.domElement.requestPointerLock()
          }, 100)
        } else if (screen !== 'mainMenu' && screen !== 'death') {
          useGameStore.getState().setScreen('playing')
          setTimeout(() => {
            gl.domElement.requestPointerLock()
          }, 100)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [gl])

  // Menu keybindings
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const screen = useGameStore.getState().screen
      const keybinds = useSettingsStore.getState().keybinds

      if (screen === 'playing') {
        if (e.code === keybinds.inventory) {
          document.exitPointerLock?.()
          useGameStore.getState().setScreen('inventory')
        } else if (e.code === keybinds.buildMenu) {
          document.exitPointerLock?.()
          useGameStore.getState().setScreen('buildMenu')
        } else if (e.code === keybinds.craftMenu) {
          document.exitPointerLock?.()
          useGameStore.getState().setScreen('craftMenu')
        } else if (e.code === keybinds.researchMenu) {
          document.exitPointerLock?.()
          useGameStore.getState().setScreen('researchMenu')
        } else if (e.code === keybinds.questLog) {
          document.exitPointerLock?.()
          useGameStore.getState().setScreen('questLog')
        } else if (e.code === keybinds.diplomacyMenu) {
          document.exitPointerLock?.()
          useGameStore.getState().setScreen('diplomacy')
        } else if (e.code === keybinds.useItem) {
          // Use consumable from hotbar
          const inv = useInventoryStore.getState()
          const slot = inv.hotbar[inv.selectedHotbarSlot]
          if (slot?.item && slot.item.type === 'consumable') {
            const item = slot.item
            const player = usePlayerStore.getState()
            const stats = item.stats || {}
            if (stats.heal && player.hp < player.maxHp) {
              player.heal(stats.heal)
              spawnDamageNumber(player.positionX, player.positionY + 0.4, player.positionZ, stats.heal, 'heal')
              useGameLogStore.getState().addMessage(`Used ${item.name}: +${stats.heal} HP`, 'loot')
              inv.removeItem(item.id)
              inv.setHotbarSlot(inv.selectedHotbarSlot, null)
            } else if (stats.stamina) {
              player.recoverStamina(stats.stamina)
              useGameLogStore.getState().addMessage(`Used ${item.name}: +${stats.stamina} Stamina`, 'loot')
              inv.removeItem(item.id)
              inv.setHotbarSlot(inv.selectedHotbarSlot, null)
            } else if (stats.attackBuff) {
              player.addBuff({ name: item.name, stat: 'attack', amount: stats.attackBuff, remaining: stats.duration || 60, duration: stats.duration || 60 })
              useGameLogStore.getState().addMessage(`Used ${item.name}: +${stats.attackBuff} ATK for ${stats.duration || 60}s`, 'loot')
              inv.removeItem(item.id)
              inv.setHotbarSlot(inv.selectedHotbarSlot, null)
            } else if (stats.defenseBuff) {
              player.addBuff({ name: item.name, stat: 'defense', amount: stats.defenseBuff, remaining: stats.duration || 60, duration: stats.duration || 60 })
              useGameLogStore.getState().addMessage(`Used ${item.name}: +${stats.defenseBuff} DEF for ${stats.duration || 60}s`, 'loot')
              inv.removeItem(item.id)
              inv.setHotbarSlot(inv.selectedHotbarSlot, null)
            }
          }
        } else if (e.code === 'Digit1') {
          useInventoryStore.getState().selectHotbarSlot(0)
        } else if (e.code === 'Digit2') {
          useInventoryStore.getState().selectHotbarSlot(1)
        } else if (e.code === 'Digit3') {
          useInventoryStore.getState().selectHotbarSlot(2)
        } else if (e.code === 'Digit4') {
          useInventoryStore.getState().selectHotbarSlot(3)
        } else if (e.code === 'Digit5') {
          useInventoryStore.getState().selectHotbarSlot(4)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05) // cap delta to prevent physics explosion
    const screen = useGameStore.getState().screen
    if (screen !== 'playing') return

    // Tick game loop systems (crafting, research, quests, world events)
    tickGameLoop(dt)

    // Auto-save every 60 seconds
    autoSaveTimer.current += dt
    if (autoSaveTimer.current >= 60) {
      autoSaveTimer.current = 0
      saveGame()
    }

    const keybinds = useSettingsStore.getState().keybinds
    const player = usePlayerStore.getState()
    if (player.isDead) return

    // Tick active buffs
    player.tickBuffs(dt)

    // Read input
    const forward = keyboard.isDown(keybinds.forward)
    const backward = keyboard.isDown(keybinds.backward)
    const left = keyboard.isDown(keybinds.left)
    const right = keyboard.isDown(keybinds.right)
    const jump = keyboard.isDown(keybinds.jump)
    const sprint = keyboard.isDown(keybinds.sprint)
    const crouch = keyboard.isDown(keybinds.crouch)

    const vel = velocity.current
    const yaw = euler.current.y

    // Calculate movement direction
    const sinY = Math.sin(yaw)
    const cosY = Math.cos(yaw)
    let moveX = 0, moveZ = 0
    if (forward) { moveX -= sinY; moveZ -= cosY }
    if (backward) { moveX += sinY; moveZ += cosY }
    if (left) { moveX -= cosY; moveZ += sinY }
    if (right) { moveX += cosY; moveZ -= sinY }

    const moveLen = Math.sqrt(moveX * moveX + moveZ * moveZ)
    if (moveLen > 0) { moveX /= moveLen; moveZ /= moveLen }

    // Determine states
    const terrainY = getTerrainHeightAt(player.positionX, player.positionZ)
    const isSwimming = player.positionY < WATER_LEVEL
    const isGrounded = player.positionY <= terrainY + 0.05 && vel.y <= 0.01
    const canSprint = sprint && player.stamina > 0 && moveLen > 0 && !isSwimming

    // Speed calc
    let speed = isSwimming ? SWIM_SPEED : MOVE_SPEED
    if (canSprint) speed *= SPRINT_MULTIPLIER
    if (crouch && !isSwimming) speed *= CROUCH_MULTIPLIER

    // Speed skill bonus
    const speedBonus = 1 + player.skills.speed * 0.03
    speed *= speedBonus

    // Weather penalty
    const weather = useWorldStore_ref.weather
    if (weather === 'storm') speed *= 0.8
    else if (weather === 'rain') speed *= 0.9

    // Apply movement forces
    const accel = isGrounded ? 14 : 5
    const friction = isGrounded ? 10 : 1.5
    vel.x += moveX * speed * accel * dt
    vel.z += moveZ * speed * accel * dt
    vel.x *= 1 / (1 + friction * dt)
    vel.z *= 1 / (1 + friction * dt)

    // Clamp horizontal speed
    const hSpeed = Math.sqrt(vel.x * vel.x + vel.z * vel.z)
    const maxH = speed * 1.1
    if (hSpeed > maxH) {
      vel.x = (vel.x / hSpeed) * maxH
      vel.z = (vel.z / hSpeed) * maxH
    }

    // Vertical physics
    if (isSwimming) {
      vel.y *= 0.92
      if (jump) vel.y = 3.5
      vel.y = clamp(vel.y, -4, 5)
    } else if (isGrounded) {
      vel.y = 0
      if (jump) {
        vel.y = JUMP_FORCE
      }
    } else {
      // Airborne
      if (jump && vel.y < 0) {
        // Gliding
        vel.y += (GLIDE_GRAVITY - vel.y) * 3 * dt
      } else {
        vel.y += GRAVITY * dt
      }
    }

    // Integrate
    let newX = player.positionX + vel.x * dt
    let newY = player.positionY + vel.y * dt
    let newZ = player.positionZ + vel.z * dt

    // Ground collision
    const newTerrainY = getTerrainHeightAt(newX, newZ)
    if (newY <= newTerrainY + 0.01) {
      // Fall damage
      if (!prevGrounded.current && vel.y < -FALL_DAMAGE_THRESHOLD) {
        const dmg = Math.abs(vel.y + FALL_DAMAGE_THRESHOLD) * FALL_DAMAGE_MULTIPLIER
        player.takeDamage(dmg)
      }
      newY = newTerrainY + 0.01
      vel.y = 0
    }
    prevGrounded.current = newY <= newTerrainY + 0.1

    // Update stores
    usePlayerStore.getState().setPosition(newX, newY, newZ)
    usePlayerStore.getState().setGrounded(prevGrounded.current)
    usePlayerStore.getState().setSprinting(canSprint)
    usePlayerStore.getState().setCrouching(crouch)
    usePlayerStore.getState().setSwimming(isSwimming)
    usePlayerStore.getState().setGliding(jump && vel.y < 0 && !isGrounded && !isSwimming)

    // Stamina (storm + plague increases drain)
    const staminaMult = (weather === 'storm' ? 1.5 : 1) * activeEventEffects.staminaDrainMultiplier
    if (canSprint) {
      usePlayerStore.getState().drainStamina(STAMINA_DRAIN_RATE * staminaMult * dt)
    } else {
      usePlayerStore.getState().recoverStamina(STAMINA_RECOVER_RATE * dt)
    }

    // Camera
    // Ant-scale camera: very low to the ground
    camera.position.set(newX, newY + (crouch ? 0.12 : 0.25), newZ)
    camera.quaternion.setFromEuler(euler.current)

    // Store rotation for other systems
    usePlayerStore.getState().setRotation(euler.current.y, euler.current.x)

    // World time tick
    useWorldStore_tick(dt)
  })

  return null
}

// Avoid importing the whole store in the render loop
const useWorldStore_tick = (dt: number) => {
  useWorldStore_ref.tick(dt)
}
import { useWorldStore } from '../../stores/worldStore'
const useWorldStore_ref = useWorldStore.getState()
// Subscribe to keep reference fresh
useWorldStore.subscribe((state) => {
  Object.assign(useWorldStore_ref, state)
})
