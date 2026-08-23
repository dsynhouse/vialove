export type BondType = 'couple' | 'parent-child' | 'friends' | 'siblings' | 'custom';

export interface BondTypeMeta {
  type: BondType;
  label: string;
  theme: { accent: string; accentSoft: string; accentStrong: string };
}

export const BOND_TYPES: BondTypeMeta[] = [
  { type: 'couple', label: 'Couple', theme: { accent: '#c1694f', accentSoft: '#f2ded6', accentStrong: '#9c4a34' } },
  {
    type: 'parent-child',
    label: 'Parent & Child',
    theme: { accent: '#7d8f5c', accentSoft: '#e2e8d3', accentStrong: '#556240' },
  },
  { type: 'friends', label: 'Friends', theme: { accent: '#4f7ea1', accentSoft: '#d7e6ef', accentStrong: '#33566e' } },
  {
    type: 'siblings',
    label: 'Siblings',
    theme: { accent: '#a1698f', accentSoft: '#ecdbe6', accentStrong: '#764869' },
  },
  {
    type: 'custom',
    label: 'Something else',
    theme: { accent: '#c79a3a', accentSoft: '#f2e7c8', accentStrong: '#96721f' },
  },
];

export function bondMeta(type: string): BondTypeMeta {
  return BOND_TYPES.find((b) => b.type === type) ?? BOND_TYPES[4];
}

export function isBondType(type: string): type is BondType {
  return BOND_TYPES.some((b) => b.type === type);
}
