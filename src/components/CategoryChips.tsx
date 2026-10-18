import React from 'react';
import { 
  Droplets, 
  Bath, 
  TreePine, 
  Zap, 
  Coffee, 
  Layers 
} from 'lucide-react';
import { FacilityCategory } from '../types';
import { Language, TRANSLATIONS } from '../utils/i18n';

interface CategoryChipsProps {
  selectedCategory: FacilityCategory;
  onSelectCategory: (cat: FacilityCategory) => void;
  categoryCounts: Record<FacilityCategory, number>;
  currentLanguage: Language;
}

export const CategoryChips: React.FC<CategoryChipsProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  currentLanguage,
}) => {
  const t = TRANSLATIONS[currentLanguage];

  const categories: {
    id: FacilityCategory;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'all', label: t.all, icon: Layers },
    { id: 'water', label: t.water, icon: Droplets },
    { id: 'toilets', label: t.toilets, icon: Bath },
    { id: 'shade', label: t.shade, icon: TreePine },
    { id: 'charging', label: t.charging, icon: Zap },
    { id: 'break', label: t.breakSpots, icon: Coffee },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar touch-pan-x">
      {categories.map(cat => {
        const Icon = cat.icon;
        const isSelected = selectedCategory === cat.id;
        const count = categoryCounts[cat.id] ?? 0;

        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all select-none min-h-[44px] cursor-pointer ${
              isSelected
                ? 'bg-brand-500 text-white shadow-sm ring-2 ring-brand-600/30 font-bold'
                : 'bg-surface-card hover:bg-surface-hover text-charcoal border border-surface-border'
            }`}
          >
            <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-brand-600'}`} />
            <span>{cat.label}</span>
            <span
              className={`text-[11px] font-bold px-1.5 py-0.2 rounded-full ${
                isSelected
                  ? 'bg-brand-700 text-brand-100'
                  : 'bg-surface-muted text-charcoal-muted'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
