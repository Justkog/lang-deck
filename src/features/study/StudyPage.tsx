import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Fab, 
  Button,
  Paper,
  FormControlLabel,
  Switch,
  Autocomplete,
  TextField,
  Chip,
  Stack,
  styled,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import { Add, PlayArrow } from '@mui/icons-material';
import { useNavigate } from 'react-router';
import { IFlashCard, getCards } from '../../services/cardService';
import { useFilter } from '../../context/FilterContext';
import useColorScheme from '../../hooks/useColorScheme';
import { getOrCreateSettings, Settings } from '../../services/settingsService';

const CustomSwitch = styled(Switch)(({ theme }) => ({
  '& .MuiSwitch-switchBase': {
    '&.Mui-checked': {
      color: theme.palette.primary.main,
      '& + .MuiSwitch-track': {
        backgroundColor: theme.palette.primary.main,
      },
    },
    '&:not(.Mui-checked)': {
      color: '#f57c00',
      '& + .MuiSwitch-track': {
        backgroundColor: '#f57c00',
      },
    },
  },
}));

export const StudyPage: React.FC = () => {
  const navigate = useNavigate();
  const colorScheme = useColorScheme();
  const { currentFilter, setFilter, applyFilter } = useFilter();
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(currentFilter.tags || []);
  const [performanceFilter, setPerformanceFilter] = useState<'struggling' | 'mastered' | 'all'>(
    currentFilter.performanceFilter || 'all'
  );
  const [showKnownLanguage, setShowKnownLanguage] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [cards, setCards] = useState<IFlashCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<IFlashCard[]>([]);

  // Load settings and cards when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        const [allCards, userSettings] = await Promise.all([
          getCards(),
          getOrCreateSettings()
        ]);
        
        const languageFilteredCards = allCards.filter(
          card => 
            card.knownLanguage === userSettings.knownLanguage && 
            card.learningLanguage === userSettings.learningLanguage
        );
        
        const allTags = new Set<string>();
        languageFilteredCards.forEach(card => {
          card.tags?.forEach(tag => allTags.add(tag));
        });
        
        setAvailableTags(Array.from(allTags));
        setSettings(userSettings);
        setCards(languageFilteredCards);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();
  }, []);

  useEffect(() => {
    console.debug('Updating filter with selected tags:', selectedTags);
    setFilter({ 
      tags: selectedTags,
      performanceFilter 
    });
  }, [selectedTags, performanceFilter, setFilter]);

  useEffect(() => {
    if (cards.length > 0) {
      setFilteredCards(applyFilter(cards));
    }
  }, [cards, currentFilter]);

  const handleAddClick = () => {
    navigate('/add');
  };

  const handleStartSession = useCallback(() => {
    navigate('/learning-session', {
      state: { 
        cards: filteredCards,
        showKnownLanguage 
      },
      replace: true
    });
  }, [filteredCards, showKnownLanguage, navigate]);

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative',
      gap: 3,
      p: 2,
      pt: 4
    }}>
      <Typography variant="h5" component="h1" align="center" gutterBottom>
        Ready to Study?
      </Typography>
      
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          width: '100%', 
          maxWidth: 400,
          borderRadius: 2,
          bgcolor: 'background.paper'
        }}
      >
        <Stack spacing={3}>
          <Box>
            <Typography 
              variant="subtitle2" 
              color={colorScheme.tagText}
              sx={{ fontWeight: 600, mb: 1 }}
            >
              PERFORMANCE FILTER
            </Typography>
            <ToggleButtonGroup
              value={performanceFilter}
              exclusive
              onChange={(_, value) => value && setPerformanceFilter(value)}
              fullWidth
              color="primary"
              size="small"
            >
              <ToggleButton value="all">
                All
              </ToggleButton>
              <ToggleButton value="struggling">
                Need Practice
              </ToggleButton>
              <ToggleButton value="mastered">
                Well Learned
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Box>
            <Typography 
              variant="subtitle2" 
              color={colorScheme.tagText}
              sx={{ fontWeight: 600, mb: 1 }}
            >
              FILTER BY TAGS
            </Typography>

            <Autocomplete
              multiple
              id="study-tags-filter"
              options={availableTags}
              value={selectedTags}
              onChange={(_, newValue) => setSelectedTags(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  placeholder={selectedTags.length === 0 ? "All tags" : ""}
                  size="small"
                />
              )}
              renderTags={(value: readonly string[], getTagProps) =>
                value.map((option: string, index: number) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option}
                    label={option}
                    sx={{
                      borderRadius: 3,
                      bgcolor: colorScheme.tagBackground,
                      color: colorScheme.tagText,
                    }}
                  />
                ))
              }
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography 
              variant="body2" 
              color={colorScheme.learningWord}
              sx={{ 
                flex: 1, 
                textAlign: 'right',
                mr: 1,
                fontWeight: showKnownLanguage ? 400 : 600
              }}
            >
              {settings?.learningLanguage || ''}
            </Typography>
            
            <CustomSwitch
              checked={showKnownLanguage}
              onChange={(e) => setShowKnownLanguage(e.target.checked)}
            />
            
            <Typography 
              variant="body2" 
              color={colorScheme.knownWord}
              sx={{ 
                flex: 1, 
                textAlign: 'left',
                ml: 1,
                fontWeight: showKnownLanguage ? 600 : 400
              }}
            >
              {settings?.knownLanguage || ''}
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
              p: 3,
              borderRadius: 4,
              background: theme => `linear-gradient(145deg, ${theme.palette.primary.main}15, ${theme.palette.primary.main}25)`,
              border: theme => `1px solid ${theme.palette.primary.main}30`,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)',
            }}
          >
            <Typography
              variant="h2"
              align="center"
              color="primary"
              sx={{
                fontWeight: 700,
                fontSize: '3rem',
                textShadow: theme => `2px 2px 4px ${theme.palette.primary.main}25`,
              }}
            >
              {filteredCards.length}
            </Typography>
            <Typography
              variant="subtitle1"
              align="center"
              color="text.secondary"
              sx={{
                fontWeight: 500,
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
            >
              {filteredCards.length === 1 ? 'Card' : 'Cards'}
            </Typography>
          </Box>
        </Stack>
      </Paper>
      
      <Button
        variant="contained"
        size="large"
        startIcon={<PlayArrow />}
        onClick={handleStartSession}
        sx={{
          px: 4,
          py: 2,
          borderRadius: 2,
          fontSize: '1.2rem',
          mt: 2
        }}
      >
        Start Session
      </Button>
      
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