export const colors = {
  bg: '#0B0C10',
  surface: '#16181D',
  border: '#23262E',
  textPrimary: '#F5F6F8',
  textMuted: '#9199A6',
  textFaint: '#666B76',
  primary: '#4A90E2',
  primaryMuted: '#2E5A8C',
  secondary: '#E2A24C', // Amber
  danger: '#E2615C',
  success: '#5CB88A',
};

export const fonts = {
  bold: 'SpaceGrotesk_700Bold',
  medium: 'SpaceGrotesk_500Medium',
};

const GRADIENTS = [
  ['#E2A24C', '#FFD27F'], // Amber
  ['#4A90E2', '#85C1E9'], // Blue
  ['#5CB88A', '#A3E4D7'], // Jade
  ['#E2615C', '#F1948A'], // Clay Red
  ['#8E24AA', '#D7BDE2'], // Violet
  ['#00ACC1', '#A9CCE3'], // Lagoon
  ['#D84315', '#F5CBA7'], // Terracotta
  ['#2E5A8C', '#5499C7']  // Denim
];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function destinationGradient(destination: string): [string, string] {
  const clean = (destination || '').trim().toLowerCase();
  if (!clean) return GRADIENTS[0] as [string, string];
  const hash = hashCode(clean);
  return GRADIENTS[hash % GRADIENTS.length] as [string, string];
}
