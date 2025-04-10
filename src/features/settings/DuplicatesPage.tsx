import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Chip,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  Button,
} from '@mui/material';
import { Delete, Merge, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router';
import { getCards, IFlashCard, deleteCard, mergeCards } from '../../services/cardService';

interface DuplicateGroup {
  key: string;
  cards: IFlashCard[];
  known: string;
  learning: string;
  knownLanguage: string;
  learningLanguage: string;
}

export const DuplicatesPage: React.FC = () => {
  const navigate = useNavigate();
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBulkMerging, setIsBulkMerging] = useState(false);

  useEffect(() => {
    const findDuplicates = async () => {
      try {
        setLoading(true);
        const cards = await getCards();
        
        // Group cards by their identifying fields
        const groups = cards.reduce((acc, card) => {
          const key = `${card.known}-${card.learning}-${card.knownLanguage}-${card.learningLanguage}`;
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(card);
          return acc;
        }, {} as Record<string, IFlashCard[]>);

        // Filter only groups with duplicates and format them
        const duplicates = Object.entries(groups)
          .filter(([_, cards]) => cards.length > 1)
          .map(([key, cards]) => ({
            key,
            cards,
            known: cards[0].known,
            learning: cards[0].learning,
            knownLanguage: cards[0].knownLanguage,
            learningLanguage: cards[0].learningLanguage,
          }));

        setDuplicateGroups(duplicates);
        setError(null);
      } catch (err) {
        console.error('Error finding duplicates:', err);
        setError('Failed to load duplicate cards');
      } finally {
        setLoading(false);
      }
    };

    findDuplicates();
  }, []);

  const handleDeleteCard = async (groupKey: string, cardId: string) => {
    try {
      await deleteCard(cardId);
      
      // Update the state to remove the deleted card
      setDuplicateGroups(prevGroups => {
        const updatedGroups = prevGroups.map(group => {
          if (group.key === groupKey) {
            const updatedCards = group.cards.filter(card => card.id !== cardId);
            // If only one card remains, remove the entire group
            if (updatedCards.length === 1) {
              return null;
            }
            return { ...group, cards: updatedCards };
          }
          return group;
        });
        // Filter out null values (removed groups)
        return updatedGroups.filter((group): group is DuplicateGroup => group !== null);
      });
    } catch (err) {
      console.error('Error deleting card:', err);
      setError('Failed to delete card. Please try again.');
    }
  };

  const handleMergeGroup = async (group: DuplicateGroup) => {
    try {
      await mergeCards(group.cards);
      
      // Remove the group from state after merging
      setDuplicateGroups(prevGroups => 
        prevGroups.filter(g => g.key !== group.key)
      );
    } catch (err) {
      console.error('Error merging cards:', err);
      setError('Failed to merge cards. Please try again.');
    }
  };

  const handleBulkMerge = async () => {
    try {
      setIsBulkMerging(true);
      for (const group of duplicateGroups) {
        await mergeCards(group.cards);
      }
      setDuplicateGroups([]); // Clear all groups after merging
    } catch (err) {
      console.error('Error bulk merging cards:', err);
      setError('Failed to merge all card groups. Please try again.');
    } finally {
      setIsBulkMerging(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
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
    <Box sx={{ p: 2, maxWidth: 800, mx: 'auto', mb: 8 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/settings')} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" component="h1">
          Manage Duplicates
        </Typography>
      </Box>

      <Typography variant="subtitle1" sx={{ mb: 3 }}>
        Found {duplicateGroups.length} groups of duplicate cards
      </Typography>

      {duplicateGroups.length > 0 && (
        <Button
          startIcon={<Merge />}
          onClick={handleBulkMerge}
          variant="contained"
          color="primary"
          disabled={isBulkMerging}
          sx={{ mb: 3 }}
        >
          {isBulkMerging ? 'Merging All Groups...' : 'Merge All Groups'}
        </Button>
      )}

      {duplicateGroups.map((group) => (
        <Card key={group.key} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography color="primary" variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {group.cards.length} duplicate cards found
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {group.knownLanguage} → {group.learningLanguage}
                </Typography>
              </Box>
              <Button
                startIcon={<Merge />}
                onClick={() => handleMergeGroup(group)}
                variant="outlined"
                color="primary"
                size="small"
                sx={{ ml: 2 }}
              >
                Merge Cards
              </Button>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" sx={{ color: 'primary.main' }}>
              {group.learning}
            </Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>
              {group.known}
            </Typography>

            <Box sx={{ mt: 3 }}>
              {group.cards.map((card, index) => (
                <Box 
                  key={card.id} 
                  sx={{ 
                    mb: 2, 
                    pl: 2, 
                    borderLeft: '2px solid', 
                    borderColor: 'divider',
                    position: 'relative'  // Added for positioning the delete button
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                      Card {index + 1}:
                    </Typography>
                    <Tooltip title="Delete this card">
                      <IconButton 
                        size="small"
                        onClick={() => handleDeleteCard(group.key, card.id)}
                        sx={{ 
                          color: 'error.light',
                          '&:hover': {
                            color: 'error.main'
                          }
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  {/* Context */}
                  {(card.contextLearning?.length || card.contextKnown?.length) && (
                    <Box sx={{ mb: 1 }}>
                      {card.contextLearning?.map((ctx, i) => (
                        <Typography key={i} variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                          {ctx}
                        </Typography>
                      ))}
                      {card.contextKnown?.map((ctx, i) => (
                        <Typography key={i} variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                          {ctx}
                        </Typography>
                      ))}
                    </Box>
                  )}

                  {/* Tags */}
                  {card.tags && card.tags.length > 0 && (
                    <Box sx={{ mb: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {card.tags.map(tag => (
                        <Chip key={tag} label={tag} size="small" />
                      ))}
                    </Box>
                  )}

                  {/* Stats */}
                  <Box sx={{ display: 'flex', gap: 2, color: 'text.secondary' }}>
                    <Typography variant="body2">
                      Correct: {card.correctCount}
                    </Typography>
                    <Typography variant="body2">
                      Wrong: {card.wrongCount}
                    </Typography>
                    <Typography variant="body2">
                      Revisit: {card.revisitCount}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      ))}

      {duplicateGroups.length === 0 && (
        <Alert severity="success" sx={{ mt: 2 }}>
          No duplicate cards found!
        </Alert>
      )}
    </Box>
  );
};
