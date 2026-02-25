import React from 'react';
import { useBackgroundColor, BG_COLOR_OPTIONS } from '../contexts/BackgroundColorContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function BackgroundColorPicker() {
  const { selectedColorId, setSelectedColorId } = useBackgroundColor();

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1.5" aria-label="Background colour picker">
        {BG_COLOR_OPTIONS.map(option => (
          <Tooltip key={option.id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setSelectedColorId(option.id)}
                aria-label={`Set background to ${option.label}`}
                className={`
                  w-5 h-5 rounded-full border-2 transition-all duration-150 flex-shrink-0
                  ${selectedColorId === option.id
                    ? 'border-primary scale-125 shadow-[0_0_0_2px_oklch(var(--primary)/0.4)]'
                    : 'border-border/60 hover:border-primary/60 hover:scale-110'
                  }
                `}
                style={
                  option.value
                    ? { backgroundColor: option.value }
                    : {
                        background:
                          'conic-gradient(from 0deg, #0f1729, #1a1a2e, #0d2137, #1e293b, #1a0a2e, #0a0a0f, #0d1f1a, #0f1729)',
                      }
                }
              />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {option.id === 'default' ? 'Default theme' : option.label}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
