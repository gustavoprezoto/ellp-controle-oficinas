"use client";
import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  Alert
} from '@mui/material';
import { workshopsAPI } from '../../../services/api';
import Layout from '../../../components/Layout/Layout';

const Catalog = () => {
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchWorkshops();
  }, []);

  const fetchWorkshops = async () => {
    try {
      const response = await workshopsAPI.getAll(true);
      setWorkshops(response.data);
    } catch (error) {
      console.error('Error fetching workshops:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (workshopId) => {
    setEnrolling(workshopId);
    setMessage('');

    try {
      await workshopsAPI.enroll(workshopId);
      setMessage('Inscrição realizada com sucesso!');
      fetchWorkshops(); // Atualizar lista
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Erro ao realizar inscrição');
    } finally {
      setEnrolling(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <Typography>Carregando...</Typography>
      </Layout>
    );
  }

  return (
    <Layout>
      <Typography variant="h4" gutterBottom>
        Catálogo de Oficinas
      </Typography>

      {message && (
        <Alert severity={message.includes('sucesso') ? 'success' : 'error'} sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <Grid container spacing={3}>
        {workshops.map((workshop) => (
          <Grid item xs={12} sm={6} md={4} key={workshop.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {workshop.title}
                </Typography>
                
                <Chip 
                  label={workshop.theme} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                  sx={{ mb: 1 }}
                />
                
                <Typography variant="body2" color="textSecondary" paragraph>
                  {workshop.description && workshop.description.length > 100 
                    ? `${workshop.description.substring(0, 100)}...` 
                    : workshop.description}
                </Typography>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Vagas:</strong> {workshop.max_students}
                  </Typography>
                  {workshop.prerequisites && (
                    <Typography variant="body2">
                      <strong>Pré-requisitos:</strong> {workshop.prerequisites}
                    </Typography>
                  )}
                </Box>
              </CardContent>
              
              <CardActions>
                <Button 
                  size="small" 
                  color="primary"
                  onClick={() => handleEnroll(workshop.id)}
                  disabled={enrolling === workshop.id}
                >
                  {enrolling === workshop.id ? 'Inscrevendo...' : 'Inscrever-se'}
                </Button>
                <Button size="small">Ver Detalhes</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {workshops.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="textSecondary">
            Nenhuma oficina disponível no momento
          </Typography>
        </Box>
      )}
    </Layout>
  );
};

export default Catalog;