import React from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router';
import { CssBaseline } from '@mui/material';
import { TabsRouter } from './routes/TabsRouter';
import { StudyPage } from './features/study/StudyPage';
import { ListPage } from './features/flashcards/ListPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { AddCardPage } from './features/flashcards/AddCardPage';
import { CardsFilterPage } from './features/flashcards/CardsFilterPage';
import { LearningSessionPage } from './features/study/LearningSessionPage';

const router = createBrowserRouter([
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
]);

function App() {
  return (
    <>
      <CssBaseline />
      <RouterProvider router={router} />
    </>
  );
}

export default App;
