export const GameState = {
  coins: 50,
  difficulty: 'medium',
  ownedAbilities: [],
  equippedAbilities: [],
  maxEquipSlots: 2,
  lastWinner: '',
  lastScorePlayer: 0,
  lastScoreAI: 0,
  pointsToWin: 11,
};

export const ABILITIES = [
  { id: 'magnet', name: 'Magnet', icon: '🧲', desc: 'Ball curves toward your paddle', price: 30 },
  { id: 'shield', name: 'Shield', icon: '🛡️', desc: 'Block one point against you', price: 50 },
  { id: 'speed', name: 'Speed+', icon: '⚡', desc: 'Faster paddle movement', price: 40 },
  { id: 'giant', name: 'Giant', icon: '🔮', desc: 'Bigger paddle for 10s', price: 60 },
  { id: 'freeze', name: 'Freeze', icon: '❄️', desc: 'Slow opponent briefly', price: 45 },
  { id: 'fireball', name: 'Fireball', icon: '🔥', desc: 'Next hit is super fast', price: 55 },
];

export function loadGameState() {
  const saved = localStorage.getItem('table_tennis_state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      Object.assign(GameState, parsed);
    } catch (e) {
      console.error('Failed to parse saved state', e);
    }
  }
}

export function saveGameState() {
  localStorage.setItem('table_tennis_state', JSON.stringify(GameState));
}
