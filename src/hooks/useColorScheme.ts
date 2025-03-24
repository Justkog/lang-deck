import { useTheme } from '@mui/material';

/**
 * Custom hook that provides consistent color scheme values across the application
 * Uses MUI theme internally for accessing theme-aware colors
 */
export const useColorScheme = () => {
  const theme = useTheme();
  
  return {
    knownWord: theme.palette.primary.main, // Blue shade
    learningWord: '#f57c00', // Orange shade
    tagBackground: '#ebf5fa', // Light bluish background
    tagText: '#2c6c8c', // Darker blue for tag text
    cardBackground: '#ffffff'
  };
};

export default useColorScheme;