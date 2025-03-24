import { useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';

/**
 * Custom hook that provides consistent color scheme values across the application
 * Uses MUI theme internally for accessing theme-aware colors
 */
export const useColorScheme = () => {
  const theme = useTheme();
  
  const knownWord = theme.palette.primary.main; // Blue shade
  const learningWord = '#f57c00'; // Orange shade
  
  return {
    knownWord,
    learningWord,
    knownWordBackground: '#f0f7ff', // Very light solid blue
    learningWordBackground: '#fff7f0', // Very light solid orange
    tagBackground: '#ebf5fa', // Light bluish background
    tagText: '#2c6c8c', // Darker blue for tag text
    cardBackground: '#ffffff'
  };
};

export default useColorScheme;