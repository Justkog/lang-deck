import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Stack,
  Button,
  IconButton,
  Paper,
  Autocomplete,
  Chip,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router';
import { getCards } from '../../services/cardService';
import { useFilter } from '../../context/FilterContext';
import useColorScheme from '../../hooks/useColorScheme';

export const CardsFilterPage: React.FC = () => {
  const navigate = useNavigate();
  const colorScheme = useColorScheme();
  const { currentFilter, setFilter, clearFilter } = useFilter();
  
  // Filter state
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(currentFilter.tags || []);
  const [word, setWord] = useState(currentFilter.word || '');
  const [context, setContext] = useState(currentFilter.context || '');
  const [performanceFilter, setPerformanceFilter] = useState<'struggling' | 'mastered' | 'all'>(
    currentFilter.performanceFilter || 'all'
  );
  
  // Load all available tags when component mounts
  useEffect(() => {
    const loadTags = async () => {
      const cards = await getCards();
      const allTags = new Set<string>();
      cards.forEach(card => {
        card.tags?.forEach(tag => allTags.add(tag));
      });
      setAvailableTags(Array.from(allTags));
    };
    
    loadTags();
  }, []);

  const handleClearFilters = () => {
    setSelectedTags([]);
    setWord('');
    setContext('');
    setPerformanceFilter('all');
    clearFilter();
    navigate(-1);
  };

  const handleApplyFilters = () => {
    setFilter({
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      word: word.trim() || undefined,
      context: context.trim() || undefined,
      performanceFilter
    });
    navigate(-1);
  };

  return (
    <Box sx={{ p: 2, maxWidth: 600, mx: 'auto', height: '100vh' }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={() => navigate(-1)} edge="start">
          <ArrowBack />
        </IconButton>
        <Typography variant="h6" sx={{ ml: 1 }}>
          Filter Cards
        </Typography>
      </Box>

      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Stack spacing={3}>
          {/* Performance filter */}
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
            >
              <ToggleButton value="all">
                All Cards
              </ToggleButton>
              <ToggleButton value="struggling">
                Need Practice
              </ToggleButton>
              <ToggleButton value="mastered">
                Well Learned
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Word search field */}
          <TextField
            label="Search words"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            fullWidth
            placeholder="Search in both languages"
          />

          {/* Context search field */}
          <TextField
            label="Search in context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            fullWidth
            placeholder="Search in example sentences"
          />

          {/* Tags section */}
          <Box>
            <Typography 
              variant="subtitle2" 
              color={colorScheme.tagText}
              sx={{ fontWeight: 600, mb: 1 }}
            >
              TAGS
            </Typography>

            <Autocomplete
              multiple
              id="tags-filter"
              options={availableTags}
              value={selectedTags}
              onChange={(_, newValue) => setSelectedTags(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  label="Select tags"
                  placeholder="Type to search tags"
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
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                    }}
                  />
                ))
              }
            />
          </Box>
        </Stack>
      </Paper>

      {/* Action buttons */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button 
          variant="outlined" 
          onClick={handleClearFilters}
        >
          Clear Filters
        </Button>
        <Button 
          variant="contained" 
          onClick={handleApplyFilters}
          color="primary"
        >
          Apply Filters
        </Button>
      </Box>
    </Box>
  );
};