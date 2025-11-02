'use client';

import React from 'react';
import { Container } from '@mui/material';
import Header from './Header';

const Layout = ({ children }) => {
  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {children}
      </Container>
    </>
  );
};

export default Layout;