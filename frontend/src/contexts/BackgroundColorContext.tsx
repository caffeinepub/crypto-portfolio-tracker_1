import React, { createContext, useContext, useState } from 'react';

export interface BgColorOption {
  id: string;
  label: string;
  value: string;
  textColor: string;
}

export const BG_COLOR_OPTIONS: BgColorOption[] = [
  { id: 'navy',    label: 'Navy',    value: '#0f1729', textColor: '#e2e8f0' },
  { id: 'charcoal',label: 'Charcoal',value: '#1a1a2e', textColor: '#e2e8f0' },
  { id: 'teal',    label: 'Teal',    value: '#0d2137', textColor: '#e2e8f0' },
  { id: 'slate',   label: 'Slate',   value: '#1e293b', textColor: '#e2e8f0' },
  { id: 'purple',  label: 'Purple',  value: '#1a0a2e', textColor: '#e2e8f0' },
  { id: 'black',   label: 'Black',   value: '#0a0a0f', textColor: '#e2e8f0' },
  { id: 'forest',  label: 'Forest',  value: '#0d1f1a', textColor: '#e2e8f0' },
  { id: 'default', label: 'Default', value: '',        textColor: '' },
];

interface BackgroundColorContextValue {
  selectedColorId: string;
  setSelectedColorId: (id: string) => void;
  bgStyle: React.CSSProperties;
}

const BackgroundColorContext = createContext<BackgroundColorContextValue>({
  selectedColorId: 'default',
  setSelectedColorId: () => {},
  bgStyle: {},
});

export function BackgroundColorProvider({ children }: { children: React.ReactNode }) {
  const [selectedColorId, setSelectedColorId] = useState<string>('default');

  const selected = BG_COLOR_OPTIONS.find(o => o.id === selectedColorId);
  const bgStyle: React.CSSProperties =
    selected && selected.value
      ? { backgroundColor: selected.value }
      : {};

  return (
    <BackgroundColorContext.Provider value={{ selectedColorId, setSelectedColorId, bgStyle }}>
      {children}
    </BackgroundColorContext.Provider>
  );
}

export function useBackgroundColor() {
  return useContext(BackgroundColorContext);
}
