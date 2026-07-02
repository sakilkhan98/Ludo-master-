import { PlayerColor } from '../types';

export interface GridPos {
  row: number;
  col: number;
}

// 52 Outer Track Cells starting from RED start (6, 1)
export const OUTER_TRACK: GridPos[] = [
  { row: 6, col: 1 },  // 0: Red Start
  { row: 6, col: 2 },  // 1
  { row: 6, col: 3 },  // 2
  { row: 6, col: 4 },  // 3
  { row: 6, col: 5 },  // 4
  { row: 5, col: 6 },  // 5
  { row: 4, col: 6 },  // 6
  { row: 3, col: 6 },  // 7
  { row: 2, col: 6 },  // 8: Star Safe Zone
  { row: 1, col: 6 },  // 9
  { row: 0, col: 6 },  // 10
  { row: 0, col: 7 },  // 11
  { row: 0, col: 8 },  // 12
  { row: 1, col: 8 },  // 13: Green Start
  { row: 2, col: 8 },  // 14
  { row: 3, col: 8 },  // 15
  { row: 4, col: 8 },  // 16
  { row: 5, col: 8 },  // 17
  { row: 6, col: 9 },  // 18
  { row: 6, col: 10 }, // 19
  { row: 6, col: 11 }, // 20
  { row: 6, col: 12 }, // 21: Star Safe Zone
  { row: 6, col: 13 }, // 22
  { row: 6, col: 14 }, // 23
  { row: 7, col: 14 }, // 24
  { row: 8, col: 14 }, // 25
  { row: 8, col: 13 }, // 26: Yellow Start
  { row: 8, col: 12 }, // 27
  { row: 8, col: 11 }, // 28
  { row: 8, col: 10 }, // 29
  { row: 8, col: 9 },  // 30
  { row: 9, col: 8 },  // 31
  { row: 10, col: 8 }, // 32
  { row: 11, col: 8 }, // 33
  { row: 12, col: 8 }, // 34: Star Safe Zone
  { row: 13, col: 8 }, // 35
  { row: 14, col: 8 }, // 36
  { row: 14, col: 7 }, // 37
  { row: 14, col: 6 }, // 38
  { row: 13, col: 6 }, // 39: Blue Start
  { row: 12, col: 6 }, // 40
  { row: 11, col: 6 }, // 41
  { row: 10, col: 6 }, // 42
  { row: 9, col: 6 },  // 43
  { row: 8, col: 5 },  // 44
  { row: 8, col: 4 },  // 45
  { row: 8, col: 3 },  // 46
  { row: 8, col: 2 },  // 47: Star Safe Zone
  { row: 8, col: 1 },  // 48
  { row: 8, col: 0 },  // 49
  { row: 7, col: 0 },  // 50
  { row: 6, col: 0 }   // 51
];

// Color start cells (indices inside the OUTER_TRACK)
export const COLOR_START_CELL: Record<PlayerColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39
};

// Safe Zone Track indices (all 8 standard safe cells)
export const SAFE_TRACK_CELLS = [
  0,  // Red start cell (6, 1)
  8,  // Top left star (2, 6)
  13, // Green start cell (1, 8)
  21, // Top right star (6, 12)
  26, // Yellow start cell (8, 13)
  34, // Bottom right star (12, 8)
  39, // Blue start cell (13, 6)
  47  // Bottom left star (8, 2)
];

// 4 Home Paths (5 steps each, leading to center)
export const HOME_PATHS: Record<PlayerColor, GridPos[]> = {
  red: [
    { row: 7, col: 1 },
    { row: 7, col: 2 },
    { row: 7, col: 3 },
    { row: 7, col: 4 },
    { row: 7, col: 5 }
  ],
  green: [
    { row: 1, col: 7 },
    { row: 2, col: 7 },
    { row: 3, col: 7 },
    { row: 4, col: 7 },
    { row: 5, col: 7 }
  ],
  yellow: [
    { row: 7, col: 13 },
    { row: 7, col: 12 },
    { row: 7, col: 11 },
    { row: 7, col: 10 },
    { row: 7, col: 9 }
  ],
  blue: [
    { row: 13, col: 7 },
    { row: 12, col: 7 },
    { row: 11, col: 7 },
    { row: 10, col: 7 },
    { row: 9, col: 7 }
  ]
};

// Finished destination center (coordinates depend on color just for visual sorting)
export const HOME_FINISH: Record<PlayerColor, GridPos> = {
  red: { row: 7, col: 6 },
  green: { row: 6, col: 7 },
  yellow: { row: 7, col: 8 },
  blue: { row: 8, col: 7 }
};

// 4 Yard box coordinates for displaying the 4 static tokens inside base
export const YARD_POSITIONS: Record<PlayerColor, GridPos[]> = {
  red: [
    { row: 2, col: 2 },
    { row: 2, col: 3 },
    { row: 3, col: 2 },
    { row: 3, col: 3 }
  ],
  green: [
    { row: 2, col: 11 },
    { row: 2, col: 12 },
    { row: 3, col: 11 },
    { row: 3, col: 12 }
  ],
  yellow: [
    { row: 11, col: 11 },
    { row: 11, col: 12 },
    { row: 12, col: 11 },
    { row: 12, col: 12 }
  ],
  blue: [
    { row: 11, col: 2 },
    { row: 11, col: 3 },
    { row: 12, col: 2 },
    { row: 12, col: 3 }
  ]
};

/**
 * Calculates the current grid position of a token based on its stepCount.
 */
export function getTokenGridPosition(color: PlayerColor, tokenIdx: number, stepCount: number): GridPos {
  if (stepCount === 0) {
    return YARD_POSITIONS[color][tokenIdx];
  }
  if (stepCount >= 1 && stepCount <= 51) {
    const startIdx = COLOR_START_CELL[color];
    const globalIdx = (startIdx + stepCount - 1) % 52;
    return OUTER_TRACK[globalIdx];
  }
  if (stepCount >= 52 && stepCount <= 56) {
    const pathIdx = stepCount - 52;
    return HOME_PATHS[color][pathIdx];
  }
  // Reached Home Finish (57)
  return HOME_FINISH[color];
}

/**
 * Checks if a track cell index is a safe zone.
 */
export function isSafeCell(stepCount: number, color: PlayerColor): boolean {
  if (stepCount === 0 || stepCount >= 52) return true; // Yard and Home Paths are completely safe
  const startIdx = COLOR_START_CELL[color];
  const globalIdx = (startIdx + stepCount - 1) % 52;
  return SAFE_TRACK_CELLS.includes(globalIdx);
}

/**
 * Maps player index to colors
 */
export const COLOR_INDEX_MAP: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];
export const COLOR_NAMES: Record<PlayerColor, string> = {
  red: 'Red',
  green: 'Green',
  yellow: 'Yellow',
  blue: 'Blue'
};

export const COLOR_CLASSES: Record<PlayerColor, { bg: string, text: string, border: string, glow: string }> = {
  red: {
    bg: 'bg-red-500',
    text: 'text-red-500',
    border: 'border-red-600',
    glow: 'shadow-red-500/50'
  },
  green: {
    bg: 'bg-green-500',
    text: 'text-green-500',
    border: 'border-green-600',
    glow: 'shadow-green-500/50'
  },
  yellow: {
    bg: 'bg-yellow-400',
    text: 'text-yellow-500',
    border: 'border-yellow-500',
    glow: 'shadow-yellow-400/50'
  },
  blue: {
    bg: 'bg-blue-500',
    text: 'text-blue-500',
    border: 'border-blue-600',
    glow: 'shadow-blue-500/50'
  }
};
