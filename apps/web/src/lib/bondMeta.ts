import type { BondTheme, BondType } from './types';

export interface BondTypeMeta {
  type: BondType;
  label: string;
  roleLabels: [string, string];
  tagline: string;
  theme: BondTheme;
  icon: string; // lucide icon name, resolved in component
}

export const BOND_TYPES: BondTypeMeta[] = [
  {
    type: 'couple',
    label: 'Couple',
    roleLabels: ['You', 'Partner'],
    tagline: 'Build a love that keeps choosing itself.',
    theme: { accent: '#c1694f', accentSoft: '#f2ded6', accentStrong: '#9c4a34' },
    icon: 'Heart',
  },
  {
    type: 'parent-child',
    label: 'Parent & Child',
    roleLabels: ['Parent', 'Child'],
    tagline: 'Grow a bond that bends but never breaks.',
    theme: { accent: '#7d8f5c', accentSoft: '#e2e8d3', accentStrong: '#556240' },
    icon: 'Sprout',
  },
  {
    type: 'friends',
    label: 'Friends',
    roleLabels: ['You', 'Friend'],
    tagline: 'The family you choose, on purpose.',
    theme: { accent: '#4f7ea1', accentSoft: '#d7e6ef', accentStrong: '#33566e' },
    icon: 'Users',
  },
  {
    type: 'siblings',
    label: 'Siblings',
    roleLabels: ['You', 'Sibling'],
    tagline: 'Old history, new understanding.',
    theme: { accent: '#a1698f', accentSoft: '#ecdbe6', accentStrong: '#764869' },
    icon: 'Users2',
  },
  {
    type: 'custom',
    label: 'Something else',
    roleLabels: ['You', 'Them'],
    tagline: 'Every meaningful bond deserves a home.',
    theme: { accent: '#c79a3a', accentSoft: '#f2e7c8', accentStrong: '#96721f' },
    icon: 'Sparkles',
  },
];

export function bondMeta(type: BondType): BondTypeMeta {
  return BOND_TYPES.find((b) => b.type === type) ?? BOND_TYPES[4];
}
