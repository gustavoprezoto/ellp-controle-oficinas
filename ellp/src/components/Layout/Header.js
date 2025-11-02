'use client';

import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box
} from '@mui/material';
import { useAuth } from '../../app/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const Header = () => {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) {
    return (
      <AppBar position="static">
        <Toolbar>
          <Button
            color="inherit"
            onClick={() => router.push('/dashboard')}
            sx={{ flexGrow: 1, justifyContent: 'flex-start', textTransform: 'none' }}
            aria-label="Ir para a página inicial"
          >
            <Typography variant="h6" component="div">
              ELLP - Controle de Oficinas
            </Typography>
          </Button>
        </Toolbar>
      </AppBar>
    );
  }

  return (
    <AppBar position="static">
      <Toolbar>
        <Button
          color="inherit"
          onClick={() => router.push('/dashboard')}
          sx={{ flexGrow: 1, justifyContent: 'flex-start', textTransform: 'none' }}
          aria-label="Ir para a página inicial"
        >
          <Typography variant="h6" component="div">
            ELLP - Controle de Oficinas
          </Typography>
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body1">
            {user.name} ({user.role})
          </Typography>
          <Button color="inherit" onClick={logout}>
            Sair
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;