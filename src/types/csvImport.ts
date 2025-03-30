// Define the expected structure of a row in the CSV
// Headers should ideally match these property names (case-insensitive usually handled by papaparse)
export interface ICsvFlashcardImportRow {
    ID?: string; // Optional: ID for the card
    Known?: string; // Corresponds to IFlashCard.known
    Learning?: string; // Corresponds to IFlashCard.learning
    'Known Language'?: string; // Use quotes if header has spaces. Corresponds to IFlashCard.knownLanguage
    'Learning Language'?: string; // Corresponds to IFlashCard.learningLanguage
    'Context Known'?: string; // Optional: Pipe-separated | examples
    'Context Learning'?: string; // Optional: Pipe-separated | examples
    Tags?: string; // Optional: Pipe-separated | tags
  }