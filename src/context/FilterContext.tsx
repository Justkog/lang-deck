import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { IFlashCard } from '../services/cardService';

export interface FilterCriteria {
  tags?: string[];
  word?: string;
  context?: string;
  performanceFilter?: 'struggling' | 'mastered' | 'all';
}

interface FilterContextType {
  currentFilter: FilterCriteria;
  setFilter: (criteria: FilterCriteria) => void;
  clearFilter: () => void;
  applyFilter: (cards: IFlashCard[]) => IFlashCard[];
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [currentFilter, setCurrentFilter] = useState<FilterCriteria>({});

  const setFilter = useCallback((criteria: FilterCriteria) => {
    setCurrentFilter(prev => ({ ...prev, ...criteria }));
  }, []);

  const clearFilter = useCallback(() => {
    setCurrentFilter({});
  }, []);

  const applyFilter = useCallback((cards: IFlashCard[]): IFlashCard[] => {
    return cards.filter(card => {
      console.debug('card', card);
      // Filter by performance
      if (currentFilter.performanceFilter && currentFilter.performanceFilter !== 'all') {
        const strugglingCount = card.wrongCount + (card.revisitCount || 0);
        const ratio = card.correctCount === 0 ?
          strugglingCount :
          strugglingCount / card.correctCount;

        console.debug('Performance ratio:', ratio);
        if (currentFilter.performanceFilter === 'struggling' && ratio < 1) {
          console.debug('Struggling filter applied');
          return false;
        }
        if (currentFilter.performanceFilter === 'mastered' && ratio >= 1) {
          console.debug('Mastered filter applied');
          return false;
        }
      }

      // Filter by tags
      if (currentFilter.tags?.length) {
        if (!card.tags?.some(tag => currentFilter.tags?.includes(tag))) {
          return false;
        }
      }

      // Filter by word
      if (currentFilter.word) {
        const searchTerm = currentFilter.word.toLowerCase();
        if (!card.known.toLowerCase().includes(searchTerm) &&
          !card.learning.toLowerCase().includes(searchTerm)) {
          return false;
        }
      }

      // Filter by context
      if (currentFilter.context) {
        const searchTerm = currentFilter.context.toLowerCase();
        const hasMatchInKnownContext = card.contextKnown?.some(ctx =>
          ctx.toLowerCase().includes(searchTerm)
        );
        const hasMatchInLearningContext = card.contextLearning?.some(ctx =>
          ctx.toLowerCase().includes(searchTerm)
        );

        if (!hasMatchInKnownContext && !hasMatchInLearningContext) {
          return false;
        }
      }

      return true;
    });
  }, [currentFilter]); // Only recreate when currentFilter changes

  const value = useMemo(() => ({
    currentFilter,
    setFilter,
    clearFilter,
    applyFilter
  }), [currentFilter, setFilter, clearFilter, applyFilter]);

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
}