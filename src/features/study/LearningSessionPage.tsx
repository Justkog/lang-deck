import React, { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import { Box, Paper, Typography, IconButton, Button } from '@mui/material';
import { ArrowBack, Undo } from '@mui/icons-material';
import { useNavigate } from 'react-router';
import TinderCard from 'react-tinder-card';
import ReactCardFlip from 'react-card-flip';
import { Card, getCardsByLanguages, updateCard } from '../../services/cardService';
import { getOrCreateSettings } from '../../services/settingsService';
import useColorScheme from '../../hooks/useColorScheme';

interface CardWithFlipState extends Card {
  isFlipped: boolean;
  isRestoring?: boolean;
}

// Types for the learning session state and actions
interface LearningSessionState {
  cards: CardWithFlipState[];
  initialCards: CardWithFlipState[];
  nextCardIndex: number;
  discardedCards: CardWithFlipState[];
  loading: boolean;
  error: string | null;
}

type LearningSessionAction =
  | { type: 'INITIALIZE_CARDS'; payload: Card[] }
  | { type: 'CARD_LEFT_SCREEN'; cardId: string }
  | { type: 'FLIP_CARD'; cardId: string }
  | { type: 'UNDO' }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'UPDATE_CARD'; payload: CardWithFlipState };

// Reducer function for handling all learning session state changes
const learningSessionReducer = (state: LearningSessionState, action: LearningSessionAction): LearningSessionState => {
  console.debug('Reducer action:', action);
  switch (action.type) {
    case 'INITIALIZE_CARDS': {
      const shuffledCards = [...action.payload].sort(() => Math.random() - 0.5)
        .map(card => ({ ...card, isFlipped: false }));
      const initialCount = Math.min(4, shuffledCards.length);

      return {
        ...state,
        initialCards: shuffledCards,
        cards: shuffledCards.slice(0, initialCount).reverse(),
        nextCardIndex: initialCount,
        loading: false,
        discardedCards: []
      };
    }

    case 'CARD_LEFT_SCREEN': {
      const discardedCard = state.cards.find(card => card.id === action.cardId);
      if (!discardedCard) return state;

      const remainingCards = state.cards.filter(card => card.id !== action.cardId);
      const newDiscardedCards = [...state.discardedCards, discardedCard];

      if (state.nextCardIndex < state.initialCards.length) {
        const nextCard = state.initialCards[state.nextCardIndex];
        return {
          ...state,
          cards: [{ ...nextCard, isFlipped: false }, ...remainingCards],
          discardedCards: newDiscardedCards,
          nextCardIndex: state.nextCardIndex + 1
        };
      }

      return {
        ...state,
        cards: remainingCards,
        discardedCards: newDiscardedCards,
        nextCardIndex: state.nextCardIndex + 1,
      };
    }

    case 'FLIP_CARD': {
      return {
        ...state,
        cards: state.cards.map(card =>
          card.id === action.cardId
            ? { ...card, isFlipped: !card.isFlipped }
            : card
        )
      };
    }

    case 'UNDO': {
      console.debug('Undo action triggered');
      if (state.discardedCards.length === 0) return state;

      const lastDiscardedCard = state.discardedCards[state.discardedCards.length - 1];
      const updatedCards = [...state.cards];

      const initialCount = Math.min(4, state.initialCards.length);
      if (updatedCards.length >= initialCount) {
        updatedCards.shift();
      }

      return {
        ...state,
        discardedCards: state.discardedCards.slice(0, -1),
        cards: [...updatedCards, { ...lastDiscardedCard, isFlipped: false, isRestoring: true }],
        nextCardIndex: state.nextCardIndex > 0 ? state.nextCardIndex - 1 : 0
      };
    }

    case 'SET_ERROR': {
      return {
        ...state,
        error: action.error,
        loading: false
      };
    }

    case 'SET_LOADING': {
      return {
        ...state,
        loading: action.loading
      };
    }

    case 'UPDATE_CARD': {
      return {
        ...state,
        cards: state.cards.map(card =>
          card.id === action.payload.id ? action.payload : card
        )
      };
    }

    default:
      return state;
  }
};

export const LearningSessionPage: React.FC = () => {
  const navigate = useNavigate();
  const colorScheme = useColorScheme();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);

  const [state, dispatch] = useReducer(learningSessionReducer, {
    cards: [],
    initialCards: [],
    nextCardIndex: 0,
    discardedCards: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    console.debug('Learning session state updated:', state);
  }, [state])

  const handleBackClick = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // Load cards on mount
  useEffect(() => {
    const loadCards = async () => {
      try {
        dispatch({ type: 'SET_LOADING', loading: true });
        const settings = await getOrCreateSettings();
        const loadedCards = await getCardsByLanguages(
          settings.knownLanguage,
          settings.learningLanguage
        );
        dispatch({ type: 'INITIALIZE_CARDS', payload: loadedCards });
      } catch (err) {
        dispatch({ type: 'SET_ERROR', error: 'Failed to load cards. Please try again.' });
        console.error('Error loading cards:', err);
      }
    };

    loadCards();
  }, []);

  const handleSwipe = useCallback(async (cardId: string, direction: string) => {
    console.debug('Card swiped:', cardId, direction);
    const card = state.cards.find(c => c.id === cardId);
    if (!card) return;
    const isCorrect = direction === 'right';

    try {
      await updateCard({
        ...card,
        correctCount: card.correctCount + (isCorrect ? 1 : 0),
        wrongCount: card.wrongCount + (isCorrect ? 0 : 1)
      });
    } catch (err) {
      console.error('Error updating card:', err);
    }
  }, [state.cards]);

  const handleCardLeftScreen = useCallback((cardId: string) => {
    dispatch({ type: 'CARD_LEFT_SCREEN', cardId });
  }, []);

  const handleUndo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY
    };
    isDraggingRef.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

    if (deltaX > 10 || deltaY > 10) {
      isDraggingRef.current = true;
    }
  }, []);

  const handleCardClick = useCallback((cardId: string, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();

    if (e.type.startsWith('touch')) {
      e.preventDefault();

      if (isDraggingRef.current) {
        return;
      }
    }

    dispatch({ type: 'FLIP_CARD', cardId });
  }, []);

  // Add this effect after your other useEffects
  useEffect(() => {
    const restoringCard = state.cards.find(card => card.isRestoring);
    if (restoringCard) {
      const timer = setTimeout(() => {
        dispatch({
          type: 'UPDATE_CARD',
          payload: { ...restoringCard, isRestoring: false }
        });
      }, 500); // Match this with animation duration
      return () => clearTimeout(timer);
    }
  }, [state.cards]);

  // Common card styles
  const cardStyles = {
    width: '300px',
    height: '400px',
    borderRadius: 4,
    p: 3,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'background.paper',
    alignItems: 'center',
    justifyContent: 'center',
  };

  if (state.loading) {
    return (
      <Box sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Typography>Loading cards...</Typography>
      </Box>
    );
  }

  if (state.error) {
    return (
      <Box sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2
      }}>
        <Typography color="error">{state.error}</Typography>
      </Box>
    );
  }

  if (state.cards.length === 0) {
    return (
      <Box sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        gap: 2
      }}>
        <Typography variant="h6" align="center">
          No cards available for your current language settings
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/')}
          startIcon={<ArrowBack />}
        >
          Back to Study
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{
      height: '100vh',
      overflow: 'hidden',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.default'
    }}>
      {/* Header */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        p: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1
      }}>
        <IconButton onClick={handleBackClick} color="primary">
          <ArrowBack />
        </IconButton>
        <IconButton
          onClick={handleUndo}
          color="primary"
          aria-label="undo last card"
          disabled={state.discardedCards.length === 0}
        >
          <Undo />
        </IconButton>
      </Box>

      {/* Remaining Cards Count */}
      <Box sx={{
        width: '100%',
        textAlign: 'center',
        mt: 8,
        mb: 2
      }}>
        <Typography variant="h6">
          {state.initialCards.length - state.discardedCards.length} / {state.initialCards.length}
        </Typography>
      </Box>

      {/* Card Container */}
      <Box sx={{
        flexGrow: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}>
        <Box sx={{
          position: 'relative',
          width: '300px',
          height: '400px'
        }}>
          {state.cards.map((card, index) => {
            const scale = 1 - (state.cards.length - 1 - index) * 0.01;
            const translateY = (state.cards.length - 1 - index) * 4;

            return (
              <TinderCard
                key={card.id}
                onSwipe={(dir) => handleSwipe(card.id, dir)}
                onCardLeftScreen={() => handleCardLeftScreen(card.id)}
                preventSwipe={['up', 'down']}
                swipeRequirementType="position"
                swipeThreshold={100}
              >
                <div
                  onClick={(e) => handleCardClick(card.id, e)}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={(e) => handleCardClick(card.id, e)}
                  className={`pressable ${card.isRestoring ? 'card-restoring' : ''}`}
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    // left: 0,
                    // top: 0,
                    touchAction: 'none',
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                    ...!card.isRestoring && {
                      transform: `scale(${scale}) translateY(${translateY}px)`,
                      transition: 'transform 0.2s ease-out'
                    }
                  }}
                >
                  <ReactCardFlip
                    isFlipped={card.isFlipped}
                    flipDirection="horizontal"
                    cardStyles={{
                      front: { WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden' },
                      back: { WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden' }
                    }}
                  >
                    {/* Front of card */}
                    <Paper
                      elevation={8}
                      sx={{
                        ...cardStyles,
                        backgroundColor: colorScheme.learningWordBackground,
                      }}
                    >
                      <Typography
                        variant="h4"
                        component="h2"
                        align="center"
                        sx={{
                          color: colorScheme.learningWord,
                          mb: 2,
                          wordBreak: 'break-word'
                        }}
                      >
                        {card.learning}
                      </Typography>
                      {card.contextLearning?.[0] && (
                        <Typography
                          variant="body1"
                          align="center"
                          sx={{
                            mt: 2,
                            fontStyle: 'italic',
                            color: 'text.secondary'
                          }}
                        >
                          {card.contextLearning[0]}
                        </Typography>
                      )}
                    </Paper>

                    {/* Back of card */}
                    <Paper
                      elevation={8}
                      sx={{
                        ...cardStyles,
                        backgroundColor: colorScheme.knownWordBackground,
                      }}
                    >
                      <Typography
                        variant="h4"
                        component="h2"
                        align="center"
                        sx={{
                          color: colorScheme.knownWord,
                          mb: 2,
                          wordBreak: 'break-word'
                        }}
                      >
                        {card.known}
                      </Typography>
                      {card.contextKnown?.[0] && (
                        <Typography
                          variant="body1"
                          align="center"
                          sx={{
                            mt: 2,
                            fontStyle: 'italic',
                            color: 'text.secondary'
                          }}
                        >
                          {card.contextKnown[0]}
                        </Typography>
                      )}
                    </Paper>
                  </ReactCardFlip>
                </div>
              </TinderCard>
            )
          })}
        </Box>
      </Box>

      {/* Instructions */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: 2,
        gap: 4,
        px: 2
      }}>
        <Typography variant="body2" color="error">
          ← Swipe left if incorrect
        </Typography>
        <Typography variant="body2" color="success.main">
          Swipe right if correct →
        </Typography>
      </Box>
    </Box>
  );
};