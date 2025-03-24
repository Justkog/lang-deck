import Dexie, { Table } from 'dexie';

// Card data model
export interface Card {
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
  createdAt: string;      // ISO timestamp for creation
  updatedAt: string;      // ISO timestamp for last update
}

// Define the database
class CardDatabase extends Dexie {
  // Define tables
  cards!: Table<Card, string>; // string is the type of the primary key

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

/**
 * Adds a new card to the database
 * @param card The card to add
 * @returns A promise that resolves when the operation is complete
 */
export async function addCard(card: Card): Promise<void> {
  try {
    await db.cards.add(card);
  } catch (error) {
    console.error('Error adding card:', error);
    throw new Error(`Failed to add card: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Retrieves all cards from the database
 * @returns A promise that resolves with an array of cards
 */
export async function getCards(): Promise<Card[]> {
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
export async function updateCard(card: Card): Promise<void> {
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
export async function getCardsByTags(tags: string[]): Promise<Card[]> {
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
export async function getCardsByPerformance(descending: boolean = true): Promise<Card[]> {
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
export async function getCardsByLanguages(knownLanguage: string, learningLanguage: string): Promise<Card[]> {
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