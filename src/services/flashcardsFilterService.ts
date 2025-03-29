import { Card } from './cardService';

export interface FilterCriteria {
  tags?: string[];
  word?: string;
  context?: string;
  performanceFilter?: 'struggling' | 'mastered' | 'all';  // New field
}

// In-memory storage for current filter
let currentFilter: FilterCriteria = {};

/**
 * Updates the current filter criteria
 */
export function setFilter(criteria: FilterCriteria): void {
  currentFilter = { ...criteria };
}

/**
 * Gets the current filter criteria
 */
export function getFilter(): FilterCriteria {
  return { ...currentFilter };
}

/**
 * Clears all filter criteria
 */
export function clearFilter(): void {
  currentFilter = {};
}

/**
 * Applies current filter criteria to an array of cards
 */
export function applyFilter(cards: Card[]): Card[] {
  return cards.filter(card => {
    // Filter by performance
    if (currentFilter.performanceFilter && currentFilter.performanceFilter !== 'all') {
      const ratio = card.correctCount === 0 ? 
        card.wrongCount : // If correctCount is 0, use wrongCount to avoid division by zero
        card.wrongCount / card.correctCount;
        
      if (currentFilter.performanceFilter === 'struggling' && ratio < 1) {
        return false;
      }
      if (currentFilter.performanceFilter === 'mastered' && ratio >= 1) {
        return false;
      }
    }

    // Filter by tags
    if (currentFilter.tags?.length) {
      if (!card.tags?.some(tag => currentFilter.tags?.includes(tag))) {
        return false;
      }
    }

    // Filter by word (in both known and learning fields)
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
}