const EMOJI: Record<string, string> = {
  tomato: '🍅', onion: '🧅', potato: '🥔', garlic: '🧄',
  chili: '🌶️', carrot: '🥕', cucumber: '🥒', eggplant: '🍆',
  corn: '🌽', pumpkin: '🎃', broccoli: '🥦', cabbage: '🥬',
  leaf: '🌿', pepper: '🫑', beans: '🫘', lemon: '🍋',
  okra: '🥒', radish: '🥕',

  mango: '🥭', banana: '🍌', pineapple: '🍍', grape: '🍇',
  watermelon: '🍉', melon: '🍈', orange: '🍊', apple: '🍎',
  strawberry: '🍓', papaya: '🥭', guava: '🍐', pomegranate: '🍎',
  fig: '🍑', chikoo: '🥝', coconut: '🥥', jackfruit: '🍈',

  wheat: '🌾', rice: '🍚', millet: '🌾', jowar: '🌾',
  sago: '⚪', peanut: '🥜', chickpea: '🫘', lentil: '🫘',
  pea: '🟢', dal: '🫘', moong: '🫘', urad: '🫘',

  default: '🌱',
};

export function emojiFor(iconKey: string): string {
  return EMOJI[iconKey] ?? EMOJI.default;
}
