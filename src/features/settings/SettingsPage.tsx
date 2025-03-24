import React, { useState } from 'react';
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
  Alert
} from '@mui/material';
import { saveSettings } from '../../services/settingsService';

// Limited list of available languages
const LANGUAGES = [
  'Anglais',
  'Français',
  'Espagnol'
];

export const SettingsPage: React.FC = () => {
  // State for settings
  const [knownLanguage, setKnownLanguage] = useState('Français');
  const [learningLanguage, setLearningLanguage] = useState('Anglais');
  
  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  
  // Handle known language selection
  const handleKnownLanguageChange = (event: SelectChangeEvent) => {
    setKnownLanguage(event.target.value);
  };
  
  // Handle learning language selection
  const handleLearningLanguageChange = (event: SelectChangeEvent) => {
    setLearningLanguage(event.target.value);
  };
  
  // Close snackbar
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };
  
  // Save settings
  const handleSave = async () => {
    try {
      await saveSettings({
        knownLanguage,
        learningLanguage
      });
      
      // Show success message with Snackbar
      setSnackbarMessage('Settings saved successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSnackbarMessage('Failed to save settings');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };
  
  return (
    <Box sx={{ 
      p: 2,
      maxWidth: 600,
      mx: 'auto',
      mb: 8 // Bottom margin to avoid overlap with TabsRouter
    }}>
      <Typography variant="h5" component="h1" sx={{ mb: 3 }}>
        Settings
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="known-language-label">Known Language</InputLabel>
          <Select
            labelId="known-language-label"
            id="known-language"
            value={knownLanguage}
            label="Known Language"
            onChange={handleKnownLanguageChange}
          >
            {LANGUAGES.map(language => (
              <MenuItem 
                key={language} 
                value={language} 
                disabled={language === learningLanguage}
              >
                {language}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="learning-language-label">Learning Language</InputLabel>
          <Select
            labelId="learning-language-label"
            id="learning-language"
            value={learningLanguage}
            label="Learning Language"
            onChange={handleLearningLanguageChange}
          >
            {LANGUAGES.map(language => (
              <MenuItem 
                key={language} 
                value={language} 
                disabled={language === knownLanguage}
              >
                {language}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleSave}
          sx={{ mt: 2 }}
        >
          Save
        </Button>
      </Box>
      
      {/* Feedback Snackbar */}
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