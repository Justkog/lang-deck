import React from 'react';
import { Box, Typography, Fab, Button } from '@mui/material';
import { Add, PlayArrow } from '@mui/icons-material';
import { useNavigate } from 'react-router';

export const StudyPage: React.FC = () => {
  const navigate = useNavigate();

  const handleAddClick = () => {
    navigate('/add');
  };

  const handleStartSession = () => {
    navigate('/learning-session');
  };

  return (
    <Box sx={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      gap: 3,
      p: 2
    }}>
      <Typography variant="h5" component="h1" align="center" gutterBottom>
        Ready to Study?
      </Typography>
      
      <Button
        variant="contained"
        size="large"
        startIcon={<PlayArrow />}
        onClick={handleStartSession}
        sx={{
          px: 4,
          py: 2,
          borderRadius: 2,
          fontSize: '1.2rem'
        }}
      >
        Start Session
      </Button>
      
      <Fab
        color="primary"
        aria-label="add"
        onClick={handleAddClick}
        sx={{
          position: 'absolute',
          bottom: 80,
          right: 16,
        }}
      >
        <Add />
      </Fab>
    </Box>
  );
};