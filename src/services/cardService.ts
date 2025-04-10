import Dexie, { Table } from 'dexie';

// Card data models
export interface IFlashCard {
  id: string;             // Unique identifier (e.g., UUID)
  known: string;          // Word/expression in the known language
  learning: string;       // Word/expression in the language to learn
  knownLanguage: string;  // The name of the known language (e.g., "français")
  learningLanguage: string; // The name of the learning language (e.g., "anglais")
  contextKnown?: string[];      // Optional context examples in the known language
  contextLearning?: string[];   // Optional context examples in the learning language
  tags?: string[];        // Optional tags for categorization
  correctCount: number;   // Count of correct guesses
  wrongCount: number;     // Count of wrong guesses
  revisitCount: number;   // Count of times marked for revision
  createdAt: string;      // ISO timestamp for creation
  updatedAt: string;      // ISO timestamp for last update
}

// Type for new flashcards before they're added to the database
export type INewFlashCard = Pick<IFlashCard, 'id' | 'known' | 'learning' | 'knownLanguage' | 'learningLanguage'> & {
  contextKnown?: string[];
  contextLearning?: string[];
  tags?: string[];
}

// Define the database
class CardDatabase extends Dexie {
  // Define tables
  cards!: Table<IFlashCard, string>; // string is the type of the primary key

  constructor() {
    super('langDeckDatabase');
    
    // Define the schema with indexes
    this.version(2).stores({
      cards: 'id, knownLanguage, learningLanguage, createdAt, updatedAt'
    });

    // Handle version migration
    this.version(1).stores({
      cards: 'id, createdAt, updatedAt'
    });
  }
}

// Create a database instance
const db = new CardDatabase();

async function bulkPutNewOnly<T extends { id: string }, P extends Partial<IFlashCard>>(
  table: Table<T & P, string>,
  items: T[],
  propertiesToSetIfNew: P
): Promise<void> {
  const existingIds = new Set(await table.where(':id').anyOf(items.map(item => item.id)).primaryKeys());
  const newItems = items.filter(item => !existingIds.has(item.id)).map(newItem => ({
    ...newItem,
    ...propertiesToSetIfNew
  }));
  const existingItemsToUpdate = items.filter(item => existingIds.has(item.id)) as (T & P)[];

  await db.transaction('rw', table, async () => {
    if (newItems.length > 0) {
      await table.bulkAdd(newItems);
    }
    if (existingItemsToUpdate.length > 0) {
      await table.bulkPut(existingItemsToUpdate);
    }
  });
}

/**
 * Adds a new card to the database
 * @param card The card to add
 * @returns A promise that resolves when the operation is complete
 */
export async function addCard(card: IFlashCard): Promise<void> {
  try {
    await db.cards.add(card);
  } catch (error) {
    console.error('Error adding card:', error);
    throw new Error(`Failed to add card: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// --- Optional Helper for Bulk Add ---
// Dexie's bulkAdd is straightforward, but a helper can encapsulate logic
export async function addMultipleFlashcardsToDB(flashcards: INewFlashCard[]): Promise<void> {
  if (!flashcards || flashcards.length === 0) {
    console.log("No flashcards provided to add.");
    return;
  }
  try {
    const timestamp = new Date().toISOString();
    await bulkPutNewOnly(db.cards, flashcards, {
      createdAt: timestamp,
      updatedAt: timestamp,
      correctCount: 0,
      wrongCount: 0,
      revisitCount: 0
    });
    console.log(`Successfully processed ${flashcards.length} flashcards.`);
  } catch (error) {
    console.error("Failed to process flashcards:", error);
    throw new Error(`Failed to add flashcards: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Retrieves all cards from the database
 * @returns A promise that resolves with an array of cards
 */
export async function getCards(): Promise<IFlashCard[]> {
  try {
    return await db.cards.toArray();
  } catch (error) {
    console.error('Error getting cards:', error);
    throw new Error(`Failed to get cards: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Updates an existing card in the database
 * @param card The card with updated values
 * @returns A promise that resolves when the operation is complete
 */
export async function updateCard(card: IFlashCard): Promise<void> {
  try {
    // Make sure to update the updatedAt timestamp
    const updatedCard = {
      ...card,
      updatedAt: new Date().toISOString()
    };
    
    await db.cards.update(card.id, updatedCard);
  } catch (error) {
    console.error('Error updating card:', error);
    throw new Error(`Failed to update card: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Deletes a card from the database
 * @param id The id of the card to delete
 * @returns A promise that resolves when the operation is complete
 */
export async function deleteCard(id: string): Promise<void> {
  try {
    await db.cards.delete(id);
  } catch (error) {
    console.error('Error deleting card:', error);
    throw new Error(`Failed to delete card: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Retrieves cards filtered by tags
 * @param tags The tags to filter by
 * @returns A promise that resolves with an array of filtered cards
 */
export async function getCardsByTags(tags: string[]): Promise<IFlashCard[]> {
  try {
    if (!tags.length) {
      return getCards();
    }
    
    return await db.cards
      .filter(card => {
        // Check if the card has at least one of the specified tags
        return card.tags?.some(tag => tags.includes(tag)) ?? false;
      })
      .toArray();
  } catch (error) {
    console.error('Error getting cards by tags:', error);
    throw new Error(`Failed to get cards by tags: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Helper function to generate a UUID
 * @returns A UUID string
 */
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Retrieves cards sorted by performance (wrong answers)
 * @param descending Whether to sort in descending order (most wrong answers first)
 * @returns A promise that resolves with an array of sorted cards
 */
export async function getCardsByPerformance(descending: boolean = true): Promise<IFlashCard[]> {
  try {
    const cards = await getCards();
    
    return cards.sort((a, b) => {
      const aRatio = a.wrongCount / (a.correctCount + a.wrongCount || 1);
      const bRatio = b.wrongCount / (b.correctCount + b.wrongCount || 1);
      
      return descending ? bRatio - aRatio : aRatio - bRatio;
    });
  } catch (error) {
    console.error('Error getting cards by performance:', error);
    throw new Error(`Failed to get cards by performance: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Retrieves cards filtered by language pair
 * @param knownLanguage The known language to filter by
 * @param learningLanguage The learning language to filter by
 * @returns A promise that resolves with an array of filtered cards
 */
export async function getCardsByLanguages(knownLanguage: string, learningLanguage: string): Promise<IFlashCard[]> {
  try {
    return await db.cards
      .where('knownLanguage')
      .equals(knownLanguage)
      .and(card => card.learningLanguage === learningLanguage)
      .toArray();
  } catch (error) {
    console.error('Error getting cards by languages:', error);
    throw new Error(`Failed to get cards by languages: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Updates the language name for all cards matching the specified source language
 * @param sourceLanguage The language name to convert from
 * @param targetLanguage The language name to convert to
 * @param fieldType Whether to update 'knownLanguage' or 'learningLanguage'
 * @returns A promise that resolves with the number of updated cards
 */
export async function convertLanguage(
  sourceLanguage: string, 
  targetLanguage: string, 
  fieldType: 'knownLanguage' | 'learningLanguage'
): Promise<number> {
  try {
    const cardsToUpdate = await db.cards
      .where(fieldType)
      .equals(sourceLanguage)
      .toArray();
    
    if (cardsToUpdate.length === 0) {
      return 0;
    }
    
    const updatedCards = cardsToUpdate.map(card => ({
      ...card,
      [fieldType]: targetLanguage,
      updatedAt: new Date().toISOString()
    }));
    
    await db.transaction('rw', db.cards, async () => {
      for (const card of updatedCards) {
        await db.cards.update(card.id, card);
      }
    });
    
    return cardsToUpdate.length;
  } catch (error) {
    console.error('Error converting language:', error);
    throw new Error(`Failed to convert language: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Merges multiple cards into one, keeping the first card and deleting others
 * @param cards Array of cards to merge (first card will be kept)
 * @returns A promise that resolves when the operation is complete
 */
export async function mergeCards(cards: IFlashCard[]): Promise<void> {
  if (cards.length < 2) return;

  const [baseCard, ...cardsToDelete] = cards;
  
  // Merge unique context and tags using Sets
  const mergedContextKnown = Array.from(new Set([
    ...(baseCard.contextKnown || []),
    ...cardsToDelete.flatMap(card => card.contextKnown || [])
  ]));
  
  const mergedContextLearning = Array.from(new Set([
    ...(baseCard.contextLearning || []),
    ...cardsToDelete.flatMap(card => card.contextLearning || [])
  ]));
  
  const mergedTags = Array.from(new Set([
    ...(baseCard.tags || []),
    ...cardsToDelete.flatMap(card => card.tags || [])
  ]));

  // Sum up the counts
  const mergedCard: IFlashCard = {
    ...baseCard,
    contextKnown: mergedContextKnown,
    contextLearning: mergedContextLearning,
    tags: mergedTags,
    correctCount: cards.reduce((sum, card) => sum + card.correctCount, 0),
    wrongCount: cards.reduce((sum, card) => sum + card.wrongCount, 0),
    revisitCount: cards.reduce((sum, card) => sum + card.revisitCount, 0),
    updatedAt: new Date().toISOString()
  };

  // Use a transaction to ensure all operations complete or none do
  await db.transaction('rw', db.cards, async () => {
    await db.cards.put(mergedCard);
    await db.cards.bulkDelete(cardsToDelete.map(card => card.id));
  });
}