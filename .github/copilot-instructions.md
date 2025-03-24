## Overview

**LangDeck** is a Progressive Web App (PWA) for language learning flashcards. Users can add cards with words/expressions in two languages (default: French for the known language and English for the language to learn), along with optional usage examples, descriptive context, and tags. In study mode, cards are presented randomly—with options to filter by tags or past performance—allowing users to guess and then reveal translations, while recording correct and incorrect attempts.

## Implementation Choices

- **Tech Stack:**  
  - **Framework:** React with TypeScript  
  - **Project Template:** Use Create React App’s PWA TypeScript template  
    ```bash
    npx create-react-app langdeck --template cra-template-pwa-typescript --legacy-peer-deps
    ```

- **UI Library:**  
  - **Material-UI (MUI):** Leverage its rich, prebuilt components (cards, buttons, forms, etc.) with excellent TypeScript support.

- **Routing & Navigation:**  
  - Use **React Router** to manage navigation between key routes:
    - `/study` (or `/`): Study session page
    - `/add`: Page or modal for adding a new flashcard
    - `/cards`: List view with filtering options (optional)
    - `/settings`: Configuration page for language preferences
  - Include a persistent navigation component (e.g., AppBar or drawer) and a global “Add Card” button accessible across screens.

- **State Management:**  
  - Utilize **React Hooks and Context** for managing global state (flashcards, configuration, session metrics).

- **Data Persistence:**  
  - Use **Dixie** as the local storage solution for persisting flashcards and performance metrics.

- **PWA Considerations:**  
  - Use the service worker and manifest configuration provided by the CRA PWA template to ensure offline functionality and asset caching.

## Folder Structure

Organize the project by feature and concern:

```
src/
  ├── components/       # Reusable UI components (e.g., Card, Button, Form elements)
  ├── features/
  │     ├── flashcards/ # Components, hooks, and services for flashcard management
  │     ├── study/      # Components and state for learning sessions
  │     └── settings/   # Configuration components for language settings and app preferences
  ├── context/          # Global state providers (e.g., FlashcardsContext, SettingsContext)
  ├── routes/           # Route definitions and layout components
  ├── services/         # Abstraction for Dixie data interactions and other API wrappers
  ├── App.tsx           # Main app component; includes router and global providers
  └── index.tsx         # Entry point; registers the service worker
```

## User Flows & Requirements

### 1. Adding & Managing Flashcards

- **Global "Add Card" Action:**  
  - A floating action button (FAB) or persistent button available on all screens.
  - Opens a form (modal or dedicated page) for adding a new card.

- **New Card Form Requirements:**  
  - **Mandatory Fields:**  
    - Word/expression in the known language  
    - Word/expression in the language to learn
  - **Optional Fields:**  
    - Example sentence showing usage  
    - List of tags  
    - Detailed context/description

- **Card Data Tracking:**  
  - Record metrics such as correct and incorrect guesses.

### 2. Learning/Study Session

- **Starting a Study Session:**  
  - “Start Learning” button available for initiating a study session.
  - Option to apply filters (by tag, or performance metrics).

- **Card Interaction:**  
  - Display a card with a prompt (in either language).
  - User taps to reveal the translation.
  - User swipes:
    - Right if the guess is correct.
    - Left if incorrect.
  - Update the card’s metrics based on user feedback.

### 3. Filtering & Deck Management

- **Filtering Options:**  
  - Allow users to filter flashcards based on tags or performance (e.g., focus on cards with more wrong answers).

- **Deck Creation:**  
  - The study session uses filtered cards to form the deck.

### 4. Configuration

- **Language Settings:**  
  - A settings page where the user can set:
    - Known language (default: French)
    - Language to learn (default: English)
- **Additional Settings (Optional):**  
  - Study preferences (e.g., session order, duration, reminders)

## Additional Guidance for Code Generation

- **TypeScript:**  
  - Define clear interfaces/types for flashcards, settings, and session metrics.

- **UI Consistency:**  
  - Use Material-UI components to maintain a uniform look and feel.

- **State & Data Management:**  
  - Manage global state via Context providers and React hooks.
  - Abstract Dixie interactions behind custom hooks or services (e.g., `useFlashcardsStore`).

- **Offline & PWA:**  
  - Ensure service worker registration is in place (via the CRA PWA template).
  - Cache the app shell and assets for offline usage.

- **Routing:**  
  - Implement route definitions with React Router.
  - Consider modal-based navigation for flows like adding a flashcard.

- **Extensibility:**  
  - Write modular and reusable components to allow for future enhancements (e.g., progress tracking, device sync).
