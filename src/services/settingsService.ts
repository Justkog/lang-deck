import Dexie, { Table } from 'dexie';

// Settings data model
export interface Settings {
  knownLanguage: string;
  learningLanguage: string;
}

// Define the database
class SettingsDatabase extends Dexie {
  // Define tables
  settings!: Table<Settings, number>; // number is the type of the primary key

  constructor() {
    super('langDeckSettingsDatabase');
    
    // Define the schema
    this.version(1).stores({
      settings: '++id' // Auto-incrementing primary key
    });
  }
}

// Create a database instance
const db = new SettingsDatabase();

// Default settings
const DEFAULT_SETTINGS: Settings = {
  knownLanguage: 'Français',
  learningLanguage: 'Anglais'
};

/**
 * Saves settings to the database
 * @param settings The settings object to save
 * @returns A promise that resolves when the operation is complete
 */
export async function saveSettings(settings: Settings): Promise<void> {
  try {
    // Clear existing settings first (we only keep one settings object)
    await db.settings.clear();
    
    // Add the new settings
    await db.settings.add(settings);
  } catch (error) {
    console.error('Error saving settings:', error);
    throw new Error(`Failed to save settings: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Retrieves settings from the database
 * @returns A promise that resolves with the settings object or null if not found
 */
export async function getSettings(): Promise<Settings | null> {
  try {
    // Get the first (and only) settings object
    const settingsArray = await db.settings.toArray();
    
    if (settingsArray.length === 0) {
      return null;
    }
    
    return settingsArray[0];
  } catch (error) {
    console.error('Error getting settings:', error);
    throw new Error(`Failed to get settings: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Gets the current settings or creates default settings if none exist
 * @returns A promise that resolves with the current settings
 */
export async function getOrCreateSettings(): Promise<Settings> {
  try {
    const settings = await getSettings();
    
    if (!settings) {
      // If no settings exist, create default settings
      await saveSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    
    return settings;
  } catch (error) {
    console.error('Error in getOrCreateSettings:', error);
    throw new Error(`Failed to get or create settings: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Updates specific settings fields without replacing the entire object
 * @param settingsUpdate Partial settings to update
 * @returns A promise that resolves when the operation is complete
 */
export async function updateSettings(settingsUpdate: Partial<Settings>): Promise<void> {
  try {
    const currentSettings = await getOrCreateSettings();
    const updatedSettings = { ...currentSettings, ...settingsUpdate };
    await saveSettings(updatedSettings);
  } catch (error) {
    console.error('Error updating settings:', error);
    throw new Error(`Failed to update settings: ${error instanceof Error ? error.message : String(error)}`);
  }
}