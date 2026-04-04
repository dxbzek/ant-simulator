import { clamp } from '../utils/math'

export const GRAVITY = -20
export const JUMP_FORCE = 8
export const MOVE_SPEED = 6
export const SPRINT_MULTIPLIER = 1.8
export const CROUCH_MULTIPLIER = 0.4
export const SWIM_SPEED = 4
export const GLIDE_GRAVITY = -3
export const STAMINA_DRAIN_RATE = 15 // per second while sprinting
export const STAMINA_RECOVER_RATE = 10 // per second while not sprinting
export const FALL_DAMAGE_THRESHOLD = 12 // velocity threshold
export const FALL_DAMAGE_MULTIPLIER = 3
export const PLAYER_HEIGHT = 0.8 // ant scale
export const PLAYER_CROUCH_HEIGHT = 0.4
export const WATER_LEVEL = -0.5

export interface MovementInput {
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
  jump: boolean
  sprint: boolean
  crouch: boolean
}

export interface MovementState {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  yaw: number
  isGrounded: boolean
  isSwimming: boolean
  isGliding: boolean
  stamina: number
  maxStamina: number
}

export function getTerrainHeight(x: number, z: number, heightFn: (x: number, z: number) => number): number {
  return heightFn(x, z)
}

export function updateMovement(
  state: MovementState,
  input: MovementInput,
  dt: number,
  heightFn: (x: number, z: number) => number
): MovementState {
  const result = { ...state }
  const terrainY = getTerrainHeight(result.x, result.z, heightFn)

  // Determine if swimming
  result.isSwimming = result.y < WATER_LEVEL

  // Calculate movement direction in world space
  const sinY = Math.sin(result.yaw)
  const cosY = Math.cos(result.yaw)

  let moveX = 0
  let moveZ = 0
  if (input.forward) { moveX -= sinY; moveZ -= cosY }
  if (input.backward) { moveX += sinY; moveZ += cosY }
  if (input.left) { moveX -= cosY; moveZ += sinY }
  if (input.right) { moveX += cosY; moveZ -= sinY }

  // Normalize diagonal movement
  const moveLen = Math.sqrt(moveX * moveX + moveZ * moveZ)
  if (moveLen > 0) {
    moveX /= moveLen
    moveZ /= moveLen
  }

  // Speed modifiers
  let speed = MOVE_SPEED
  let canSprint = input.sprint && result.stamina > 0 && moveLen > 0
  if (result.isSwimming) {
    speed = SWIM_SPEED
    canSprint = false
  }
  if (canSprint) speed *= SPRINT_MULTIPLIER
  if (input.crouch && !result.isSwimming) speed *= CROUCH_MULTIPLIER

  // Apply horizontal movement with smooth acceleration
  const accel = result.isGrounded ? 12 : 4
  const friction = result.isGrounded ? 8 : 1
  result.vx += moveX * speed * accel * dt
  result.vz += moveZ * speed * accel * dt

  // Apply friction
  result.vx *= 1 / (1 + friction * dt)
  result.vz *= 1 / (1 + friction * dt)

  // Clamp horizontal speed
  const hSpeed = Math.sqrt(result.vx * result.vx + result.vz * result.vz)
  const maxSpeed = speed * 1.2
  if (hSpeed > maxSpeed) {
    result.vx = (result.vx / hSpeed) * maxSpeed
    result.vz = (result.vz / hSpeed) * maxSpeed
  }

  // Vertical physics
  if (result.isSwimming) {
    // Swimming: gentle sink, can swim up with jump
    result.vy *= 0.9
    if (input.jump) result.vy = 3
    result.vy = clamp(result.vy, -4, 5)
  } else if (result.isGrounded) {
    result.vy = 0
    if (input.jump) {
      result.vy = JUMP_FORCE
      result.isGrounded = false
    }
  } else {
    // Airborne
    if (input.jump && result.vy < 0) {
      // Gliding
      result.vy += (GLIDE_GRAVITY - result.vy) * 3 * dt
      result.isGliding = true
    } else {
      result.vy += GRAVITY * dt
      result.isGliding = false
    }
  }

  // Apply velocity
  result.x += result.vx * dt
  result.y += result.vy * dt
  result.z += result.vz * dt

  // Ground collision
  const newTerrainY = getTerrainHeight(result.x, result.z, heightFn)
  const playerFeet = newTerrainY + 0.01
  if (result.y <= playerFeet) {
    // Fall damage check
    if (!state.isGrounded && state.vy < -FALL_DAMAGE_THRESHOLD) {
      const fallDmg = Math.abs(state.vy + FALL_DAMAGE_THRESHOLD) * FALL_DAMAGE_MULTIPLIER
      // Return damage info through vy as a signal (caller handles damage)
    }
    result.y = playerFeet
    result.vy = 0
    result.isGrounded = true
    result.isGliding = false
  } else {
    result.isGrounded = false
  }

  // Stamina
  if (canSprint) {
    result.stamina = Math.max(0, result.stamina - STAMINA_DRAIN_RATE * dt)
  } else if (!input.sprint) {
    result.stamina = Math.min(result.maxStamina, result.stamina + STAMINA_RECOVER_RATE * dt)
  }

  return result
}
