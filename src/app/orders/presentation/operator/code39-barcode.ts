/** Code 39 barcode generator (no libraries): turns "B001-00000001" into bar
 *  geometry for an inline SVG on the printed boleta. Code 39 was chosen because
 *  it natively supports digits, uppercase letters and '-' — exactly the
 *  alphabet of our boleta numbers — and every scanner reads it. */

interface Code39Bar {
  x: number;
  width: number;
}

/** 9 elements per char (bar,space,bar,space,bar,space,bar,space,bar);
 *  w = wide, n = narrow. Standard Code 39 table. */
const CODE39: Record<string, string> = {
  '0': 'nnnwwnwnn', '1': 'wnnwnnnnw', '2': 'nnwwnnnnw', '3': 'wnwwnnnnn',
  '4': 'nnnwwnnnw', '5': 'wnnwwnnnn', '6': 'nnwwwnnnn', '7': 'nnnwnnwnw',
  '8': 'wnnwnnwnn', '9': 'nnwwnnwnn', 'A': 'wnnnnwnnw', 'B': 'nnwnnwnnw',
  'C': 'wnwnnwnnn', 'D': 'nnnnwwnnw', 'E': 'wnnnwwnnn', 'F': 'nnwnwwnnn',
  'G': 'nnnnnwwnw', 'H': 'wnnnnwwnn', 'I': 'nnwnnwwnn', 'J': 'nnnnwwwnn',
  'K': 'wnnnnnnww', 'L': 'nnwnnnnww', 'M': 'wnwnnnnwn', 'N': 'nnnnwnnww',
  'O': 'wnnnwnnwn', 'P': 'nnwnwnnwn', 'Q': 'nnnnnnwww', 'R': 'wnnnnnwwn',
  'S': 'nnwnnnwwn', 'T': 'nnnnwnwwn', 'U': 'wwnnnnnnw', 'V': 'nwwnnnnnw',
  'W': 'wwwnnnnnn', 'X': 'nwnnwnnnw', 'Y': 'wwnnwnnnn', 'Z': 'nwwnwnnnn',
  '-': 'nwnnnnwnw', '*': 'nwnnwnwnn',
};

const NARROW = 1;
const WIDE = 2.5;
const GAP = 1;   // narrow space between characters

/** Bars for the given text (auto-wrapped in Code 39's start/stop '*').
 *  Returns null if the text has characters outside the supported alphabet. */
export function code39Bars(text: string): { bars: Code39Bar[]; totalWidth: number } | null {
  const chars = `*${text.toUpperCase()}*`.split('');
  if (chars.some(c => !CODE39[c])) return null;

  const bars: Code39Bar[] = [];
  let x = 0;
  for (const char of chars) {
    const pattern = CODE39[char];
    for (let i = 0; i < pattern.length; i++) {
      const width = pattern[i] === 'w' ? WIDE : NARROW;
      if (i % 2 === 0) bars.push({ x, width });   // even index = bar, odd = space
      x += width;
    }
    x += GAP;
  }
  return { bars, totalWidth: x - GAP };
}
