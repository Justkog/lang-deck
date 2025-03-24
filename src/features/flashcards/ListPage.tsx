import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Fab, 
  Card, 
  CardContent, 
  Chip,
  Stack,
  CircularProgress,
  Alert,
  Divider,
  useTheme,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Badge
} from '@mui/material';
import { Add, Delete, Edit, FilterList } from '@mui/icons-material';
import { useNavigate } from 'react-router';
import { getCards, Card as FlashCard, deleteCard } from '../../services/cardService';
import { getOrCreateSettings, Settings } from '../../services/settingsService';
import { getFilter, applyFilter } from '../../services/flashcardsFilterService';
import useColorScheme from '../../hooks/useColorScheme';

export const ListPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<FlashCard[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cardToDelete, setCardToDelete] = useState<FlashCard | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Load settings and cards when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load settings
        const userSettings = await getOrCreateSettings();
        setSettings(userSettings);
        
        // Load cards
        const allCards = await getCards();
        setCards(allCards);
        
        // Filter cards based on language settings and user filters
        const languageFiltered = allCards.filter(
          card => 
            card.knownLanguage === userSettings.knownLanguage && 
            card.learningLanguage === userSettings.learningLanguage
        );
        
        // Apply user filters
        const userFiltered = applyFilter(languageFiltered);
        setFilteredCards(userFiltered);
        setError(null);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load cards. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handleAddClick = () => {
    navigate('/add');
  };

  const handleDeleteClick = (card: FlashCard) => {
    setCardToDelete(card);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!cardToDelete) return;

    try {
      await deleteCard(cardToDelete.id);
      setFilteredCards(prev => prev.filter(card => card.id !== cardToDelete.id));
      setCards(prev => prev.filter(card => card.id !== cardToDelete.id));
      setCardToDelete(null);
    } catch (err) {
      console.error('Error deleting card:', err);
      setDeleteError('Failed to delete card. Please try again.');
    }
  };

  const handleCancelDelete = () => {
    setCardToDelete(null);
    setDeleteError(null);
  };

  const handleEditClick = (card: FlashCard) => {
    navigate('/add', { 
      state: { 
        mode: 'edit',
        card
      }
    });
  };

  const handleFilterClick = () => {
    navigate('/filter');
  };

  if (loading) {
    return (
      <Box sx={{ 
        height: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: 2,
      mb: 8, // Bottom margin to avoid overlap with TabsRouter
      position: 'relative'
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3
      }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
          My Flashcards
        </Typography>
        <IconButton 
          onClick={handleFilterClick}
          sx={{ mr: 1 }}
        >
          <Badge 
            color="primary" 
            variant="dot" 
            invisible={!Object.keys(getFilter()).length}
          >
            <FilterList />
          </Badge>
        </IconButton>
      </Box>
      
      {settings && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
          {settings.knownLanguage} → {settings.learningLanguage}
        </Typography>
      )}
      
      {/* Confirmation Dialog */}
      <Dialog
        open={cardToDelete !== null}
        onClose={handleCancelDelete}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Flashcard
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this flashcard?
          </Typography>
          {cardToDelete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography color="primary" fontWeight="bold">
                {cardToDelete.learning}
              </Typography>
              <Typography color="text.secondary">
                {cardToDelete.known}
              </Typography>
            </Box>
          )}
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {filteredCards.length === 0 ? (
        <Box sx={{ 
          py: 8, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          color: 'text.secondary'
        }}>
          <Typography variant="h6" gutterBottom>
            No cards found
          </Typography>
          <Typography variant="body1">
            Get started by adding some flashcards with the + button
          </Typography>
        </Box>
      ) : (
        <Stack spacing={2}>
          {filteredCards.map((card) => (
            <Card 
              key={card.id} 
              variant="outlined" 
              sx={{ 
                borderRadius: 2,
                borderColor: theme.palette.divider,
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                },
                bgcolor: colorScheme.cardBackground
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    {/* Learning Word Section */}
                    <Box sx={{ mb: 2 }}>
                      <Typography 
                        variant="h6" 
                        component="div" 
                        gutterBottom
                        sx={{ 
                          color: colorScheme.learningWord,
                          fontWeight: 600,
                          fontSize: '1.25rem'
                        }}
                      >
                        {card.learning}
                      </Typography>
                      
                      {/* Learning Context right under learning word */}
                      {(card.contextLearning && card.contextLearning.length > 0) && (
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontStyle: 'italic',
                            color: colorScheme.learningWord,
                            opacity: 0.8,
                            mb: 1
                          }}
                        >
                          {card.contextLearning[0]}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex' }}>
                    <IconButton
                      onClick={() => handleEditClick(card)}
                      size="small"
                      sx={{ 
                        color: 'text.secondary',
                        '&:hover': {
                          color: 'primary.main'
                        }
                      }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDeleteClick(card)}
                      size="small"
                      sx={{ 
                        ml: 1,
                        color: 'text.secondary',
                        '&:hover': {
                          color: 'error.main'
                        }
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                
                <Divider sx={{ my: 1.5 }} />
                
                {/* Known Word Section */}
                <Box sx={{ mt: 2 }}>
                  <Typography 
                    sx={{ 
                      color: colorScheme.knownWord,
                      fontSize: '1.1rem',
                      fontWeight: 500
                    }}
                  >
                    {card.known}
                  </Typography>
                  
                  {/* Known Context right under known word */}
                  {(card.contextKnown && card.contextKnown.length > 0) && (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontStyle: 'italic',
                        color: colorScheme.knownWord,
                        opacity: 0.8,
                        mt: 0.5
                      }}
                    >
                      {card.contextKnown[0]}
                    </Typography>
                  )}
                </Box>
                
                {/* Tags Section */}
                {card.tags && card.tags.length > 0 && (
                  <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.7 }}>
                    {card.tags.map(tag => (
                      <Chip 
                        key={tag} 
                        label={tag} 
                        size="small" 
                        sx={{
                          borderRadius: 3,
                          bgcolor: colorScheme.tagBackground,
                          color: colorScheme.tagText,
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          '&:hover': {
                            bgcolor: theme.palette.primary.light,
                            color: theme.palette.primary.contrastText
                          }
                        }}
                      />
                    ))}
                  </Box>
                )}
                
                {/* Statistics Section */}
                <Box sx={{ 
                  mt: 2, 
                  display: 'flex', 
                  justifyContent: 'flex-end',
                  color: 'text.secondary',
                  fontSize: '0.75rem'
                }}>
                  <Box 
                    component="span" 
                    sx={{ 
                      mr: 2, 
                      display: 'flex',
                      alignItems: 'center',
                      '&::before': {
                        content: '""',
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        bgcolor: 'success.main',
                        mr: 0.5
                      }
                    }}
                  >
                    Correct: {card.correctCount}
                  </Box>
                  <Box 
                    component="span"
                    sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      '&::before': {
                        content: '""',
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        bgcolor: 'error.main',
                        mr: 0.5
                      }
                    }}
                  >
                    Wrong: {card.wrongCount}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
      
      <Fab
        color="primary"
        aria-label="add"
        onClick={handleAddClick}
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 16,
        }}
      >
        <Add />
      </Fab>
    </Box>
  );
};