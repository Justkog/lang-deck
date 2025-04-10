import React from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router';
import { CssBaseline } from '@mui/material';
import { FilterProvider } from './context/FilterContext';
import { TabsRouter } from './routes/TabsRouter';
import { StudyPage } from './features/study/StudyPage';
import { ListPage } from './features/flashcards/ListPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { AddCardPage } from './features/flashcards/AddCardPage';
import { CardsFilterPage } from './features/flashcards/CardsFilterPage';
import { LearningSessionPage } from './features/study/LearningSessionPage';
import FlashcardImporter from './features/settings/FlashcardImporter';
import { LanguageConversionPage } from './features/settings/LanguageConversionPage';
import { DuplicatesPage } from './features/settings/DuplicatesPage';
import './App.css';

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <TabsRouter />,
      children: [
        {
          path: '/',
          element: <StudyPage />,
        },
        {
          path: '/list',
          element: <ListPage />,
        },
        {
          path: '/settings',
          element: <SettingsPage />,
        },
      ],
    },
    {
      path: '/add',
      element: <AddCardPage />,
    },
    {
      path: '/filter',
      element: <CardsFilterPage />,
    },
    {
      path: '/learning-session',
      element: <LearningSessionPage />,
    },
    {
      path: '/import-csv',
      element: <FlashcardImporter />,
    },
    {
      path: '/language-conversion',
      element: <LanguageConversionPage />,
    },
    {
      path: '/duplicates',
      element: <DuplicatesPage />,
    },
  ],
  {
    basename: '/lang-deck'
  }
);

function App() {
  return (
    <FilterProvider>
      <CssBaseline />
      <RouterProvider router={router} />
    </FilterProvider>
  );
}

export default App;
