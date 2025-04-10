import React from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { School, List, Settings } from '@mui/icons-material';

export const TabsRouter: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    navigate(newValue);
  };

  return (
    <>
      <div style={{ paddingBottom: '56px' }}>
        <Outlet />
      </div>
      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10 }} elevation={3}>
        <BottomNavigation value={location.pathname} onChange={handleChange}>
          <BottomNavigationAction
            label="Study"
            value="/"
            icon={<School />}
          />
          <BottomNavigationAction
            label="List"
            value="/list"
            icon={<List />}
          />
          <BottomNavigationAction
            label="Settings"
            value="/settings"
            icon={<Settings />}
          />
        </BottomNavigation>
      </Paper>
    </>
  );
}