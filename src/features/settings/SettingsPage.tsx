import React, { useState } from 'react';
import { useNavigate } from 'react-router';
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
  Stack
} from '@mui/material';
import papa from 'papaparse';
import { saveSettings } from '../../services/settingsService';
import { ICsvFlashcardImportRow } from '../../types/csvImport';
import { getCards, IFlashCard } from '../../services/cardService';

// Limited list of available languages
const LANGUAGES = [
  'Anglais',
  'Français',
  'Espagnol'
];

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
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
  
  const handleImportCSV = () => {
    navigate('/import-csv');
  };

  const downloadTemplateCSV = () => {
    // Create example data
    const examples: ICsvFlashcardImportRow[] = [
      {
        Known: "Bonjour",
        Learning: "Hello",
        "Known Language": "Français",
        "Learning Language": "Anglais",
        "Context Known": "Bonjour, comment allez-vous?|Bonjour tout le monde!",
        "Context Learning": "Hello, how are you?|Hello everyone!",
        Tags: "greetings|basic"
      },
      {
        Known: "Au revoir",
        Learning: "Goodbye",
        "Known Language": "Français",
        "Learning Language": "Anglais",
        "Context Known": "Au revoir et à bientôt!",
        "Context Learning": "Goodbye and see you soon!",
        Tags: "greetings|basic"
      },
      {
        Known: "Merci",
        Learning: "Thank you",
        "Known Language": "Français",
        "Learning Language": "Anglais",
        "Context Known": "Merci beaucoup!|Je vous remercie",
        "Context Learning": "Thank you very much!|I thank you",
        Tags: "basic|politeness"
      },
      {
        Known: "S'il vous plaît",
        Learning: "Please",
        "Known Language": "Français",
        "Learning Language": "Anglais",
        "Context Known": "Pourriez-vous m'aider, s'il vous plaît?",
        "Context Learning": "Could you help me, please?",
        Tags: "basic|politeness"
      },
      {
        Known: "Enchanté(e)",
        Learning: "Nice to meet you",
        "Known Language": "Français",
        "Learning Language": "Anglais",
        "Context Known": "Enchanté de faire votre connaissance",
        "Context Learning": "Nice to meet you",
        Tags: "greetings|social"
      }
    ];

    // Use Papa Parse to convert to CSV
    const csvContent = papa.unparse(examples, {
      quotes: true, // Force quotes around all fields
      quoteChar: '"',
      escapeChar: '"',
      delimiter: ",",
      header: true,
      skipEmptyLines: true
    });

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'langdeck_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = async () => {
    try {
      // Get all cards from the database
      const cards = await getCards();
      
      // Convert cards to CSV format
      const csvData: ICsvFlashcardImportRow[] = cards.map(card => ({
        ID: card.id,
        Known: card.known,
        Learning: card.learning,
        "Known Language": card.knownLanguage,
        "Learning Language": card.learningLanguage,
        "Context Known": card.contextKnown?.join('|'),
        "Context Learning": card.contextLearning?.join('|'),
        Tags: card.tags?.join('|')
      }));

      // Use Papa Parse to convert to CSV
      const csvContent = papa.unparse(csvData, {
        quotes: true, // Force quotes around all fields
        quoteChar: '"',
        escapeChar: '"',
        delimiter: ",",
        header: true,
        skipEmptyLines: true
      });

      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().split('T')[0];
      link.download = `langdeck_export_${timestamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show success message
      setSnackbarMessage('Cards exported successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error exporting cards:', error);
      setSnackbarMessage('Failed to export cards');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  return (
    <Box sx={{ 
      p: 2,
      maxWidth: 600,
      mx: 'auto',
      mb: 8
    }}>
      <Typography variant="h5" component="h1" sx={{ mb: 3 }}>
        Settings
      </Typography>
      
      {/* Language Settings Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Language
        </Typography>
        
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
        >
          Save
        </Button>
      </Box>
      
      {/* Import Section */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Data
        </Typography>
        
        <Stack spacing={2}>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleImportCSV}
            fullWidth
          >
            Import Cards from CSV File
          </Button>

          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate('/import-csv?mode=url')}
            fullWidth
          >
            Import from Google Sheets URL
          </Button>

          <Button
            variant="outlined"
            color="secondary"
            onClick={handleExportCSV}
            fullWidth
          >
            Export All Cards to CSV
          </Button>

          <Button
            variant="outlined"
            color="secondary"
            onClick={downloadTemplateCSV}
            fullWidth
          >
            Download CSV Template
          </Button>
        </Stack>
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