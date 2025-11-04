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
  Alert,
  CircularProgress
} from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import { workshopsAPI } from '../../../services/api';
import Layout from '../../../components/Layout/Layout';
import { useAuth } from '../../../app/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const Catalog = () => {
  const [workshops, setWorkshops] = useState([]);
  const [enrollments, setEnrollments] = useState({});
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);
  const [message, setMessage] = useState('');
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchWorkshops();
    }
  }, [user]);

  const fetchWorkshops = async () => {
    try {
      setLoading(true);
      const response = await workshopsAPI.getAll(true);
      const workshopsData = response.data;
      setWorkshops(workshopsData);

      // Verificar inscrições do usuário em cada oficina
      const enrollmentStatus = {};
      for (const workshop of workshopsData) {
        try {
          const studentsResponse = await workshopsAPI.getStudents(workshop.id);
          const isEnrolled = studentsResponse.data.some(student => student.id === user.id);
          enrollmentStatus[workshop.id] = isEnrolled;
        } catch (error) {
          console.error(`Error checking enrollment for workshop ${workshop.id}:`, error);
          enrollmentStatus[workshop.id] = false;
        }
      }
      setEnrollments(enrollmentStatus);
    } catch (error) {
      console.error('Error fetching workshops:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (workshopId) => {
    if (!user) {
      setMessage('Você precisa estar logado para se inscrever');
      return;
    }

    setEnrolling(workshopId);
    setMessage('');

    try {
      await workshopsAPI.enroll(workshopId);
      setMessage('Inscrição realizada com sucesso!');
      
      // Atualizar status de inscrição
      setEnrollments(prev => ({
        ...prev,
        [workshopId]: true
      }));
      
      // Atualizar lista para mostrar vagas atualizadas
      fetchWorkshops();
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Erro ao realizar inscrição');
    } finally {
      setEnrolling(null);
    }
  };

  const handleUnenroll = async (workshopId) => {
    if (!user) return;

    setEnrolling(workshopId);
    setMessage('');

    try {
      // Nota: Você precisará criar uma rota para cancelar inscrição no backend
      await workshopsAPI.unenroll(workshopId);
      setMessage('Inscrição cancelada com sucesso!');
      
      // Atualizar status de inscrição
      setEnrollments(prev => ({
        ...prev,
        [workshopId]: false
      }));
      
      fetchWorkshops();
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Erro ao cancelar inscrição');
    } finally {
      setEnrolling(null);
    }
  };

  const handleViewDetails = (workshopId) => {
    router.push(`/workshops/${workshopId}`);
  };

  const getAvailableSpots = (workshop) => {
    // Esta informação viria do backend, por enquanto é uma estimativa
    return workshop.max_students;
  };

  const isWorkshopFull = (workshop) => {
    // Verificar se a oficina está cheia (você pode ajustar isso conforme seus dados)
    return getAvailableSpots(workshop) <= 0;
  };

  if (loading) {
    return (
      <Layout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Typography variant="h4" gutterBottom>
        Catálogo de Oficinas
      </Typography>

      {message && (
        <Alert 
          severity={message.includes('sucesso') ? 'success' : 'error'} 
          sx={{ mb: 2 }}
          onClose={() => setMessage('')}
        >
          {message}
        </Alert>
      )}

      <Grid container spacing={3}>
        {workshops.map((workshop) => {
          const isEnrolled = enrollments[workshop.id] || false;
          const isFull = isWorkshopFull(workshop);
          const availableSpots = getAvailableSpots(workshop);

          return (
            <Grid item xs={12} sm={6} md={4} key={workshop.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  border: isEnrolled ? '2px solid #4caf50' : '1px solid #e0e0e0',
                  position: 'relative'
                }}
              >
                {/* Badge de status */}
                <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
                  {isEnrolled && (
                    <Chip 
                      icon={<CheckCircle />}
                      label="Inscrito"
                      color="success"
                      size="small"
                    />
                  )}
                  {isFull && !isEnrolled && (
                    <Chip 
                      icon={<Cancel />}
                      label="Lotada"
                      color="error"
                      size="small"
                    />
                  )}
                </Box>

                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {workshop.title}
                  </Typography>
                  
                  {workshop.theme && (
                    <Chip 
                      label={workshop.theme} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                      sx={{ mb: 1 }}
                    />
                  )}
                  
                  <Typography variant="body2" color="textSecondary" paragraph sx={{ mt: 2 }}>
                    {workshop.description && workshop.description.length > 100 
                      ? `${workshop.description.substring(0, 100)}...` 
                      : workshop.description || 'Sem descrição'}
                  </Typography>

                  <Box sx={{ mt: 'auto' }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Vagas disponíveis:</strong> {availableSpots}
                    </Typography>
                    
                    {workshop.prerequisites && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Pré-requisitos:</strong> {workshop.prerequisites}
                      </Typography>
                    )}

                    {workshop.start_date && (
                      <Typography variant="body2">
                        <strong>Início:</strong> {new Date(workshop.start_date).toLocaleDateString('pt-BR')}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
                
                <CardActions>
                  {!user ? (
                    <Button 
                      size="small" 
                      color="primary"
                      onClick={() => router.push('/login')}
                    >
                      Faça login para se inscrever
                    </Button>
                  ) : isEnrolled ? (
                    <>
                      <Button 
                        size="small" 
                        color="success"
                        variant="outlined"
                        startIcon={<CheckCircle />}
                        disabled
                      >
                        Inscrito
                      </Button>
                      <Button 
                        size="small" 
                        color="error"
                        onClick={() => handleUnenroll(workshop.id)}
                        disabled={enrolling === workshop.id}
                      >
                        {enrolling === workshop.id ? 'Cancelando...' : 'Cancelar'}
                      </Button>
                    </>
                  ) : isFull ? (
                    <Button 
                      size="small" 
                      color="error"
                      disabled
                      startIcon={<Cancel />}
                    >
                      Oficina Lotada
                    </Button>
                  ) : (
                    <Button 
                      size="small" 
                      color="primary"
                      variant="contained"
                      onClick={() => handleEnroll(workshop.id)}
                      disabled={enrolling === workshop.id}
                    >
                      {enrolling === workshop.id ? 'Inscrevendo...' : 'Inscrever-se'}
                    </Button>
                  )}
                  
                  <Button 
                    size="small" 
                    onClick={() => handleViewDetails(workshop.id)}
                  >
                    Ver Detalhes
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {workshops.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="textSecondary">
            Nenhuma oficina disponível no momento
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Volte mais tarde para ver novas oficinas.
          </Typography>
        </Box>
      )}
    </Layout>
  );
};

export default Catalog;