import React, { useState, ChangeEvent } from 'react';
import { useNavigate, useLocation } from 'react-router';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import { 
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  styled,
  IconButton,
  TextField
} from '@mui/material';
import { 
  CloudUpload,
  Check,
  ArrowBack,
  ArrowRight,
  Language,
  TextFields,
  LocalOffer,
  Assignment
} from '@mui/icons-material';
import { ICsvFlashcardImportRow } from '../../types/csvImport';
import { 
  addMultipleFlashcardsToDB, 
  IFlashCard,
  INewFlashCard 
} from '../../services/cardService';

const VisuallyHiddenInput = styled('input')`
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  bottom: 0;
  left: 0;
  white-space: nowrap;
  width: 1px;
`;

const FlashcardImporter: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sheetUrl, setSheetUrl] = useState('');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Check if we're in URL import mode
  const isUrlMode = new URLSearchParams(location.search).get('mode') === 'url';

  // Common function to process CSV data
  const processCsvData = async (results: Papa.ParseResult<ICsvFlashcardImportRow>) => {
    console.log('Parsed CSV data:', results.data);
    setImportStatus('Processing flashcards...');

    const flashcards: INewFlashCard[] = [];
    let skippedCount = 0;
    const validationErrors: string[] = [];

    results.data.forEach((row, index) => {
      const rowIndex = index + 2; // For user-friendly error messages (1-based + header)

      // --- Core Field Validation ---
      const known = row.Known?.trim();
      const learning = row.Learning?.trim();
      const knownLang = row['Known Language']?.trim();
      const learningLang = row['Learning Language']?.trim();

      if (!known) validationErrors.push(`Row ${rowIndex}: Missing 'Known' value.`);
      if (!learning) validationErrors.push(`Row ${rowIndex}: Missing 'Learning' value.`);
      if (!knownLang) validationErrors.push(`Row ${rowIndex}: Missing 'Known Language' value.`);
      if (!learningLang) validationErrors.push(`Row ${rowIndex}: Missing 'Learning Language' value.`);

      // If core fields are missing, skip this row
      if (!known || !learning || !knownLang || !learningLang) {
         skippedCount++;
         return; // Move to the next row
      }

      // --- Create Flashcard Object ---
      try {
         const flashcard: INewFlashCard = {
            id: row.ID?.trim() || uuidv4(),
            known,
            learning,
            knownLanguage: knownLang,
            learningLanguage: learningLang,
            contextKnown: splitToArray(row['Context Known']),
            contextLearning: splitToArray(row['Context Learning']),
            tags: splitToArray(row.Tags)
         };
         flashcards.push(flashcard);
      } catch (creationError) {
         console.error(`Error processing row ${rowIndex}:`, creationError);
         validationErrors.push(`Row ${rowIndex}: Error during processing (${creationError instanceof Error ? creationError.message : creationError})`);
         skippedCount++;
      }
    });

    // --- Post-Processing Feedback ---
    if (validationErrors.length > 0) {
        console.warn("Validation issues found during import:", validationErrors);
        setError(`Import completed with issues. Skipped ${skippedCount} rows. First few issues: ${validationErrors.slice(0, 3).join('; ')} (Check console for details)`);
    }

    if (flashcards.length === 0) {
         setError(prevError => `${prevError ? prevError + ' ' : ''}Import failed. No valid flashcards could be created from the file. Check column headers and data.`.trim());
         setIsImporting(false);
         setImportStatus('');
         return;
    }

    setImportStatus(`Processing ${flashcards.length} flashcards...`);

    try {
      // Use the improved bulkPutNewOnly which handles both new and existing cards
      await addMultipleFlashcardsToDB(flashcards);
      setImportStatus(`Successfully processed ${flashcards.length} flashcards! ${skippedCount > 0 ? `Skipped ${skippedCount} invalid rows.` : ''} ${validationErrors.length > 0 ? 'Some rows had validation issues (see console).' : ''}`);
      setSelectedFile(null); // Clear selection after successful import
    } catch (dbError) {
      console.error('Error processing flashcards:', dbError);
      setError(`Failed to process flashcards. ${dbError instanceof Error ? dbError.message : String(dbError)}`);
      setImportStatus('');
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError('');
    setImportStatus('');
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
      } else {
        setError('Please select a valid CSV file.');
        setSelectedFile(null);
      }
      // Clear the input value to allow re-uploading the same file name
      event.target.value = '';
    } else {
      setSelectedFile(null);
    }
  };

  // Helper to safely split pipe-separated strings into arrays
  const splitToArray = (input: string | undefined | null): string[] | undefined => {
    if (!input || typeof input !== 'string' || input.trim() === '') {
      return undefined; // Return undefined if input is empty or not a string
    }
    return input.split('|').map(s => s.trim()).filter(s => s.length > 0);
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setError('No file selected.');
      return;
    }

    setIsImporting(true);
    setError('');
    setImportStatus('Parsing CSV file...');

    Papa.parse<ICsvFlashcardImportRow>(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: processCsvData,
      error: (error: Error, file: File) => {
        console.error('Error parsing CSV:', error);
        setError(`Failed to parse CSV file: ${error.message}`);
        setIsImporting(false);
        setImportStatus('');
      },
    });
  };

  const handleUrlImport = async () => {
    if (!sheetUrl || !sheetUrl.startsWith('https://docs.google.com/spreadsheets/d/')) {
      setError('Please enter a valid Google Sheet publish URL ending in /pub?output=csv');
      return;
    }

    try {
      const url = new URL(sheetUrl);
      const hasValidPath = url.pathname.endsWith('/pub');
      const hasValidOutput = url.searchParams.get('output') === 'csv';

      if (!hasValidPath || !hasValidOutput) {
        setError('The URL must be the *published CSV* link. Go to File > Share > Publish to web, select CSV, and copy the generated link.');
        return;
      }

      setIsImporting(true);
      setError('');
      setImportStatus('Fetching data from URL...');

      const response = await fetch(sheetUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      }
      const csvText = await response.text();

      setImportStatus('Parsing CSV data...');
      Papa.parse<ICsvFlashcardImportRow>(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: processCsvData,
        error: (error: Error, file: any) => {
          console.error('Error parsing CSV:', error);
          setError(`Failed to parse CSV data: ${error.message}`);
          setIsImporting(false);
          setImportStatus('');
        },
      });
    } catch (err) {
      console.error('Error fetching CSV:', err);
      setError(`Failed to fetch CSV: ${err instanceof Error ? err.message : String(err)}`);
      setIsImporting(false);
      setImportStatus('');
    }
  };

  return (
    <Box sx={{ 
      p: 2,
      maxWidth: 800,
      mx: 'auto',
      mb: 8
    }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={() => navigate(-1)} edge="start">
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" component="h1">
          {isUrlMode ? 'Import from Google Sheets' : 'Import from CSV File'}
        </Typography>
      </Box>

      <Stack spacing={3}>
        {/* Instructions Paper */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3,
            borderRadius: 2,
            bgcolor: 'background.paper'
          }}
        >
          <Typography variant="h6" sx={{ mb: 2 }}>
            CSV File Requirements
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon>
                <TextFields color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Known (Required)" 
                secondary="Word in your known language" 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <TextFields color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Learning (Required)" 
                secondary="Word in the language you're learning" 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Language color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Known Language (Required)" 
                secondary="Name of your known language (e.g., English)" 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Language color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Learning Language (Required)" 
                secondary="Name of the language you're learning (e.g., Spanish)" 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Assignment color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Context Known (Optional)" 
                secondary="Example sentences (use '|' to separate multiple examples)" 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Assignment color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Context Learning (Optional)" 
                secondary="Example sentences (use '|' to separate multiple examples)" 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <LocalOffer color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Tags (Optional)" 
                secondary="Tags for organization (use '|' to separate multiple tags)" 
              />
            </ListItem>
          </List>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              <ArrowRight sx={{ verticalAlign: 'middle', mr: 1 }} />
              {isUrlMode ? (
                <>
                  In Google Sheets: <strong>File &gt; Share &gt; Publish to web</strong>.<br/>
                  Choose your sheet, select <strong>Comma-separated values (.csv)</strong> format,<br/>
                  Click <strong>Publish</strong>, and paste the URL below.
                </>
              ) : (
                <>
                  In Google Sheets, go to <strong>File &gt; Download &gt; Comma Separated Values (.csv)</strong>
                </>
              )}
            </Typography>
          </Box>
        </Paper>

        {/* Import Controls */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 3,
            borderRadius: 2,
            bgcolor: 'background.paper',
            textAlign: 'center'
          }}
        >
          {isUrlMode ? (
            <>
              <TextField
                label="Google Sheets Published CSV URL"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                disabled={isImporting}
                fullWidth
                sx={{ mb: 2 }}
                placeholder="Paste the published CSV URL here"
                helperText="URL should end with /pub?output=csv"
              />
              <Button
                variant="contained"
                onClick={handleUrlImport}
                disabled={isImporting || !sheetUrl}
                startIcon={isImporting ? <CircularProgress size={20} /> : <CloudUpload />}
              >
                {isImporting ? 'Importing...' : 'Import from URL'}
              </Button>
            </>
          ) : (
            <>
              <Button
                component="label"
                variant="outlined"
                startIcon={<CloudUpload />}
                disabled={isImporting}
                sx={{ mb: 2 }}
              >
                Select CSV File
                <VisuallyHiddenInput
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                />
              </Button>

              {selectedFile && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Selected file: {selectedFile.name}
                  </Typography>
                  <Button 
                    variant="contained"
                    onClick={handleImport}
                    disabled={isImporting}
                    startIcon={isImporting ? <CircularProgress size={20} /> : <Check />}
                  >
                    {isImporting ? 'Importing...' : 'Start Import'}
                  </Button>
                </Box>
              )}
            </>
          )}

          {/* Status and Error Messages */}
          {importStatus && (
            <Alert 
              severity="info" 
              sx={{ mt: 2 }}
              icon={isImporting ? <CircularProgress size={20} /> : undefined}
            >
              {importStatus}
            </Alert>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <AlertTitle>Import Error</AlertTitle>
              {error}
            </Alert>
          )}
        </Paper>
      </Stack>
    </Box>
  );
};

export default FlashcardImporter;