import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Button,
  SelectChangeEvent,
  Snackbar,
  Alert,
  FormHelperText,
  IconButton
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router';
import { getCards, convertLanguage } from '../../services/cardService';

// Limited list of available languages
const LANGUAGES = [
  'Anglais',
  'Français',
  'Espagnol',
];

export const LanguageConversionPage: React.FC = () => {
  const navigate = useNavigate();
  const [sourceLanguage, setSourceLanguage] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [conversionType, setConversionType] = useState<'knownLanguage' | 'learningLanguage'>('knownLanguage');
  const [existingLanguages, setExistingLanguages] = useState<string[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  useEffect(() => {
    const loadExistingLanguages = async () => {
      try {
        const cards = await getCards();
        const knownLangs = new Set(cards.map(card => card.knownLanguage));
        const learningLangs = new Set(cards.map(card => card.learningLanguage));
        const allLangs = [...new Set([...knownLangs, ...learningLangs])].sort();
        setExistingLanguages(allLangs);
        
        if (allLangs.length > 0 && sourceLanguage === '') {
          setSourceLanguage(allLangs[0]);
        }
      } catch (error) {
        console.error('Failed to load existing languages:', error);
      }
    };
    
    loadExistingLanguages();
  }, [sourceLanguage]);

  const handleSourceLanguageChange = (event: SelectChangeEvent) => {
    setSourceLanguage(event.target.value);
  };
  
  const handleTargetLanguageChange = (event: SelectChangeEvent) => {
    setTargetLanguage(event.target.value);
  };
  
  const handleConversionTypeChange = (event: SelectChangeEvent) => {
    setConversionType(event.target.value as 'knownLanguage' | 'learningLanguage');
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleConvertLanguage = async () => {
    if (!sourceLanguage || !targetLanguage) {
      setSnackbarMessage('Please select both source and target languages');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    
    if (sourceLanguage === targetLanguage) {
      setSnackbarMessage('Source and target languages must be different');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    
    try {
      setIsConverting(true);
      const updatedCount = await convertLanguage(sourceLanguage, targetLanguage, conversionType);
      
      setSnackbarMessage(`Successfully converted ${updatedCount} cards from "${sourceLanguage}" to "${targetLanguage}"`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      const cards = await getCards();
      const knownLangs = new Set(cards.map(card => card.knownLanguage));
      const learningLangs = new Set(cards.map(card => card.learningLanguage));
      const allLangs = [...new Set([...knownLangs, ...learningLangs])].sort();
      setExistingLanguages(allLangs);
      
      if (!allLangs.includes(sourceLanguage)) {
        setSourceLanguage(allLangs.length > 0 ? allLangs[0] : '');
      }
    } catch (error) {
      console.error('Failed to convert language:', error);
      setSnackbarMessage('Failed to convert language');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <Box sx={{ p: 2, maxWidth: 600, mx: 'auto', mb: 8 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/settings')} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" component="h1">
          Language Conversion
        </Typography>
      </Box>

      <Typography variant="body2" sx={{ mb: 3 }}>
        Convert languages in your existing flashcards to standardize language names.
      </Typography>
      
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel id="conversion-type-label">Convert in Field</InputLabel>
        <Select
          labelId="conversion-type-label"
          id="conversion-type"
          value={conversionType}
          label="Convert in Field"
          onChange={handleConversionTypeChange}
        >
          <MenuItem value="knownLanguage">Known Language</MenuItem>
          <MenuItem value="learningLanguage">Learning Language</MenuItem>
        </Select>
        <FormHelperText>
          Select which language field to update in your cards
        </FormHelperText>
      </FormControl>
      
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel id="source-language-label">Source Language</InputLabel>
        <Select
          labelId="source-language-label"
          id="source-language"
          value={sourceLanguage}
          label="Source Language"
          onChange={handleSourceLanguageChange}
        >
          {existingLanguages.map(language => (
            <MenuItem 
              key={language} 
              value={language}
              disabled={language === targetLanguage}
            >
              {language}
            </MenuItem>
          ))}
        </Select>
        <FormHelperText>
          Select the language name to convert from
        </FormHelperText>
      </FormControl>
      
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel id="target-language-label">Target Language</InputLabel>
        <Select
          labelId="target-language-label"
          id="target-language"
          value={targetLanguage}
          label="Target Language"
          onChange={handleTargetLanguageChange}
        >
          {LANGUAGES.map(language => (
            <MenuItem 
              key={language} 
              value={language}
              disabled={language === sourceLanguage}
            >
              {language}
            </MenuItem>
          ))}
        </Select>
        <FormHelperText>
          Select the standardized language name to convert to
        </FormHelperText>
      </FormControl>
      
      <Button 
        variant="contained" 
        color="primary" 
        onClick={handleConvertLanguage}
        disabled={!sourceLanguage || !targetLanguage || sourceLanguage === targetLanguage || isConverting}
        fullWidth
      >
        Convert Language
      </Button>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
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
