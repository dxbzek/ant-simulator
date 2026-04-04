export interface KeybindConfig {
  forward: string
  backward: string
  left: string
  right: string
  jump: string
  sprint: string
  crouch: string
  interact: string
  attack: string
  inventory: string
  buildMenu: string
  questLog: string
  craftMenu: string
  researchMenu: string
  diplomacyMenu: string
  pause: string
  hotbar1: string
  hotbar2: string
  hotbar3: string
  hotbar4: string
  hotbar5: string
}

export const DEFAULT_KEYBINDS: KeybindConfig = {
  forward: 'KeyW',
  backward: 'KeyS',
  left: 'KeyA',
  right: 'KeyD',
  jump: 'Space',
  sprint: 'ShiftLeft',
  crouch: 'KeyC',
  interact: 'KeyE',
  attack: 'mouse0',
  inventory: 'KeyI',
  buildMenu: 'KeyB',
  questLog: 'KeyJ',
  craftMenu: 'KeyK',
  researchMenu: 'KeyR',
  diplomacyMenu: 'KeyF',
  pause: 'Escape',
  hotbar1: 'Digit1',
  hotbar2: 'Digit2',
  hotbar3: 'Digit3',
  hotbar4: 'Digit4',
  hotbar5: 'Digit5',
}
