import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  IconButton, 
  Chip,
  Stack,
  Divider,
  InputAdornment,
  Paper,
  Fab,
  Collapse,
  Typography,
  Snackbar,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  OutlinedInput,
  useTheme
} from '@mui/material';
import { Add, Delete, ArrowBack, Save, Close } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router';
import { addCard, updateCard, generateId, Card } from '../../services/cardService';
import { getOrCreateSettings, Settings } from '../../services/settingsService';
import useColorScheme from '../../hooks/useColorScheme';

interface LocationState {
  mode?: 'edit' | 'create';
  card?: Card;
}

// TypeScript interfaces for our form data
interface FlashcardData {
  knownLanguageWord: string;
  learningLanguageWord: string;
  knownLanguageContexts: string[];
  learningLanguageContexts: string[];
  tags: string[];
}

export const AddCardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, card: editCard } = (location.state as LocationState) || {};
  const isEditMode = mode === 'edit' && editCard;
  const theme = useTheme();
  const colorScheme = useColorScheme();
  
  // Language settings state
  const [settings, setSettings] = useState<Settings>({
    knownLanguage: 'Français',
    learningLanguage: 'Anglais'
  });
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [knownLanguageWord, setKnownLanguageWord] = useState('');
  const [learningLanguageWord, setLearningLanguageWord] = useState('');
  
  // Independent contexts for each language
  const [learningLanguageContexts, setLearningLanguageContexts] = useState<string[]>([]);
  const [knownLanguageContexts, setKnownLanguageContexts] = useState<string[]>([]);
  
  // Independent state for showing context forms
  const [showLearningContextForm, setShowLearningContextForm] = useState(false);
  const [showKnownContextForm, setShowKnownContextForm] = useState(false);
  
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  
  // Feedback states
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Error states
  const [errors, setErrors] = useState({
    knownLanguageWord: false,
    learningLanguageWord: false
  });

  // Load language settings when component mounts
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const userSettings = await getOrCreateSettings();
        setSettings(userSettings);
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  // Load card data if in edit mode
  useEffect(() => {
    if (isEditMode && editCard) {
      setKnownLanguageWord(editCard.known);
      setLearningLanguageWord(editCard.learning);
      setKnownLanguageContexts(editCard.contextKnown || []);
      setLearningLanguageContexts(editCard.contextLearning || []);
      setTags(editCard.tags || []);
      setShowKnownContextForm(Boolean(editCard.contextKnown?.length));
      setShowLearningContextForm(Boolean(editCard.contextLearning?.length));
    }
  }, [isEditMode, editCard]);

  // Learning language context functions
  const addLearningContext = () => {
    setLearningLanguageContexts([...learningLanguageContexts, '']);
    setShowLearningContextForm(true);
  };

  const removeLearningContext = (index: number) => {
    const newContexts = [...learningLanguageContexts];
    newContexts.splice(index, 1);
    setLearningLanguageContexts(newContexts);
    if (newContexts.length === 0) {
      setShowLearningContextForm(false);
    }
  };

  const handleLearningContextChange = (index: number, value: string) => {
    const newContexts = [...learningLanguageContexts];
    newContexts[index] = value;
    setLearningLanguageContexts(newContexts);
  };

  // Known language context functions
  const addKnownContext = () => {
    setKnownLanguageContexts([...knownLanguageContexts, '']);
    setShowKnownContextForm(true);
  };

  const removeKnownContext = (index: number) => {
    const newContexts = [...knownLanguageContexts];
    newContexts.splice(index, 1);
    setKnownLanguageContexts(newContexts);
    if (newContexts.length === 0) {
      setShowKnownContextForm(false);
    }
  };

  const handleKnownContextChange = (index: number, value: string) => {
    const newContexts = [...knownLanguageContexts];
    newContexts[index] = value;
    setKnownLanguageContexts(newContexts);
  };

  // Add a tag
  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  // Remove a tag
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Handle tag input keypress (add tag on Enter)
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentTag.trim()) {
      e.preventDefault();
      addTag();
    }
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors = {
      knownLanguageWord: !knownLanguageWord.trim(),
      learningLanguageWord: !learningLanguageWord.trim()
    };
    
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  // Form submission
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const cardData: Card = {
        id: isEditMode ? editCard!.id : generateId(),
        known: knownLanguageWord.trim(),
        learning: learningLanguageWord.trim(),
        knownLanguage: settings.knownLanguage,
        learningLanguage: settings.learningLanguage,
        contextKnown: knownLanguageContexts.filter(ctx => ctx.trim()),
        contextLearning: learningLanguageContexts.filter(ctx => ctx.trim()),
        tags: tags.length > 0 ? tags : undefined,
        correctCount: isEditMode ? editCard!.correctCount : 0,
        wrongCount: isEditMode ? editCard!.wrongCount : 0,
        createdAt: isEditMode ? editCard!.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Save or update the card
      if (isEditMode) {
        await updateCard(cardData);
        setSnackbarMessage('Card updated successfully!');
      } else {
        await addCard(cardData);
        setSnackbarMessage('Card saved successfully!');
      }
      
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigate(-1);
      }, 1500);
    } catch (error) {
      console.error('Error saving card:', error);
      setSnackbarMessage(`Failed to ${isEditMode ? 'update' : 'save'} card: ${error instanceof Error ? error.message : String(error)}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close snackbar
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: 2, 
      maxWidth: 600, 
      mx: 'auto', 
      height: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={() => navigate(-1)} edge="start" color="primary">
          <ArrowBack />
        </IconButton>
        <Typography variant="h6" component="h1" sx={{ ml: 1, fontWeight: 500 }}>
          {isEditMode ? 'Edit Flashcard' : 'New Flashcard'}
        </Typography>
      </Box>
      
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          borderRadius: 4,
          backgroundColor: 'background.paper',
          flexGrow: 1,
          overflow: 'auto'
        }}
      >
        <form onSubmit={handleSubmit}>
          <Stack spacing={4}>
            {/* Learning language section - with dynamic language from settings */}
            <Box>
              <Typography 
                variant="subtitle2" 
                color={colorScheme.learningWord} 
                sx={{ fontWeight: 600 }}
                gutterBottom
              >
                {settings.learningLanguage.toUpperCase()} (LEARNING)
              </Typography>
              
              <FormControl 
                fullWidth 
                variant="outlined" 
                margin="normal"
                error={errors.learningLanguageWord}
              >
                <InputLabel htmlFor="learning-word-input">
                  Word or expression to learn
                </InputLabel>
                <OutlinedInput
                  id="learning-word-input"
                  value={learningLanguageWord}
                  onChange={(e) => setLearningLanguageWord(e.target.value)}
                  label="Word or expression to learn"
                  sx={{ borderRadius: 2 }}
                />
                {errors.learningLanguageWord && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                    This field is required
                  </Typography>
                )}
              </FormControl>
              
              <Collapse in={showLearningContextForm} timeout="auto">
                <Stack spacing={2} sx={{ mt: 2 }}>
                  {learningLanguageContexts.map((context, index) => (
                    <Box key={index} sx={{ position: 'relative' }}>
                      <FormControl fullWidth variant="outlined">
                        <InputLabel htmlFor={`learning-context-${index}`}>
                          Example sentence or context ({settings.learningLanguage})
                        </InputLabel>
                        <OutlinedInput
                          id={`learning-context-${index}`}
                          value={context}
                          onChange={(e) => handleLearningContextChange(index, e.target.value)}
                          label={`Example sentence or context (${settings.learningLanguage})`}
                          sx={{ pr: 5, borderRadius: 2 }}
                          endAdornment={
                            <InputAdornment position="end">
                              <IconButton 
                                size="small" 
                                onClick={() => removeLearningContext(index)}
                                edge="end"
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </InputAdornment>
                          }
                        />
                      </FormControl>
                    </Box>
                  ))}
                </Stack>
              </Collapse>
              
              {!showLearningContextForm && (
                <Button 
                  onClick={addLearningContext}
                  sx={{ 
                    mt: 1,
                    color: 'text.secondary',
                    textTransform: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Add fontSize="small" />
                  Add context
                </Button>
              )}
              
              {showLearningContextForm && (
                <Button 
                  onClick={addLearningContext}
                  sx={{ 
                    mt: 1,
                    color: 'text.secondary',
                    textTransform: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Add fontSize="small" />
                  Add another context
                </Button>
              )}
            </Box>
            
            <Divider />
            
            {/* Known language section - with dynamic language from settings */}
            <Box>
              <Typography 
                variant="subtitle2" 
                color={colorScheme.knownWord}
                sx={{ fontWeight: 600 }}
                gutterBottom
              >
                {settings.knownLanguage.toUpperCase()} (KNOWN)
              </Typography>
              
              <FormControl 
                fullWidth 
                variant="outlined" 
                margin="normal"
                error={errors.knownLanguageWord}
              >
                <InputLabel htmlFor="known-word-input">
                  Translation in your language
                </InputLabel>
                <OutlinedInput
                  id="known-word-input"
                  value={knownLanguageWord}
                  onChange={(e) => setKnownLanguageWord(e.target.value)}
                  label="Translation in your language"
                  sx={{ borderRadius: 2 }}
                />
                {errors.knownLanguageWord && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                    This field is required
                  </Typography>
                )}
              </FormControl>
              
              <Collapse in={showKnownContextForm} timeout="auto">
                <Stack spacing={2} sx={{ mt: 2 }}>
                  {knownLanguageContexts.map((context, index) => (
                    <Box key={index} sx={{ position: 'relative' }}>
                      <FormControl fullWidth variant="outlined">
                        <InputLabel htmlFor={`known-context-${index}`}>
                          Example sentence or context ({settings.knownLanguage})
                        </InputLabel>
                        <OutlinedInput
                          id={`known-context-${index}`}
                          value={context}
                          onChange={(e) => handleKnownContextChange(index, e.target.value)}
                          label={`Example sentence or context (${settings.knownLanguage})`}
                          sx={{ pr: 5, borderRadius: 2 }}
                          endAdornment={
                            <InputAdornment position="end">
                              <IconButton 
                                size="small" 
                                onClick={() => removeKnownContext(index)}
                                edge="end"
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </InputAdornment>
                          }
                        />
                      </FormControl>
                    </Box>
                  ))}
                </Stack>
              </Collapse>
              
              {!showKnownContextForm && (
                <Button 
                  onClick={addKnownContext}
                  sx={{ 
                    mt: 1,
                    color: 'text.secondary',
                    textTransform: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Add fontSize="small" />
                  Add context
                </Button>
              )}
              
              {showKnownContextForm && (
                <Button 
                  onClick={addKnownContext}
                  sx={{ 
                    mt: 1,
                    color: 'text.secondary',
                    textTransform: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Add fontSize="small" />
                  Add another context
                </Button>
              )}
            </Box>
            
            <Divider />
            
            {/* Tags section */}
            <Box>
              <Typography 
                variant="subtitle2" 
                color={colorScheme.tagText}
                sx={{ fontWeight: 600 }}
                gutterBottom
              >
                TAGS
              </Typography>
              
              <FormControl fullWidth variant="outlined" margin="normal">
                <InputLabel htmlFor="tags-input">Add tags (press Enter after each tag)</InputLabel>
                <OutlinedInput
                  id="tags-input"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={handleTagKeyPress}
                  label="Add tags (press Enter after each tag)"
                  sx={{ borderRadius: 2 }}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton onClick={addTag} edge="end" disabled={!currentTag.trim()}>
                        <Add />
                      </IconButton>
                    </InputAdornment>
                  }
                />
              </FormControl>
              
              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => removeTag(tag)}
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
            </Box>
          </Stack>
        </form>
      </Paper>
      
      {/* Floating action buttons */}
      <Box sx={{ 
        position: 'fixed', 
        bottom: 20, 
        right: 20, 
        display: 'flex', 
        gap: 2 
      }}>
        <Fab
          color="default"
          aria-label="cancel"
          onClick={() => navigate(-1)}
          size="medium"
          disabled={isSubmitting}
        >
          <Close />
        </Fab>
        <Fab
          color="primary"
          aria-label="save"
          onClick={() => handleSubmit()}
          size="medium"
          disabled={isSubmitting}
        >
          <Save />
        </Fab>
      </Box>
      
      {/* Feedback snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Helper component for the Add Context button
const Button: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  sx?: any;
}> = ({ onClick, children, sx }) => (
  <Box 
    component="button"
    onClick={onClick}
    sx={{
      border: 'none',
      background: 'none',
      cursor: 'pointer',
      p: 0,
      m: 0,
      display: 'flex',
      alignItems: 'center',
      fontSize: '0.875rem',
      ...sx
    }}
  >
    {children}
  </Box>
);