"use client";
import React, { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Box,
  Grid,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import { Visibility, Cancel, CalendarToday, Group, Person, Refresh } from '@mui/icons-material';
import { usersAPI, workshopsAPI } from '../../../services/api';
import Layout from '../../../components/Layout/Layout';
import { useAuth } from '../../../app/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const MyEnrollments = () => {
  const [enrolledWorkshops, setEnrolledWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unenrolling, setUnenrolling] = useState(null);
  const [message, setMessage] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchMyEnrollments();
    }
  }, [user]);

  const fetchMyEnrollments = async () => {
    try {
      setLoading(true);
      setDebugInfo('');
      console.log('🔄 Buscando inscrições para usuário:', user.id, user.name);

      // Tentar método principal primeiro
      try {
        const response = await usersAPI.getMyEnrollments();
        console.log('✅ Inscrições encontradas (método principal):', response.data);
        setEnrolledWorkshops(response.data);
        setDebugInfo(`Método principal - ${response.data.length} oficinas`);
        return;
      } catch (primaryError) {
        console.log('❌ Método principal falhou, tentando método direto...', primaryError);
      }

      // Tentar método alternativo
      try {
        const response = await usersAPI.getMyEnrollmentsDirect();
        console.log('✅ Inscrições encontradas (método direto):', response.data);
        setEnrolledWorkshops(response.data);
        setDebugInfo(`Método direto - ${response.data.length} oficinas`);
        return;
      } catch (directError) {
        console.log('❌ Método direto falhou, tentando fallback...', directError);
      }

      // Último fallback: buscar todas as oficinas e verificar uma por uma
      console.log('🔄 Usando fallback manual...');
      const fallbackResult = await fetchEnrollmentsFallback();
      setEnrolledWorkshops(fallbackResult);
      setDebugInfo(`Fallback manual - ${fallbackResult.length} oficinas`);

    } catch (error) {
      console.error('💥 Todos os métodos falharam:', error);
      setMessage('Erro ao carregar suas inscrições');
      setDebugInfo('Erro em todos os métodos');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollmentsFallback = async () => {
    try {
      const response = await workshopsAPI.getAll(true);
      const allWorkshops = response.data;
      
      const enrolled = [];
      for (const workshop of allWorkshops) {
        try {
          const studentsResponse = await workshopsAPI.getStudents(workshop.id);
          const isEnrolled = studentsResponse.data.some(student => student.id === user.id);
          console.log(`📋 Oficina ${workshop.id} - "${workshop.title}": Inscrito? ${isEnrolled}`);
          
          if (isEnrolled) {
            enrolled.push({
              ...workshop,
              studentCount: studentsResponse.data.length
            });
          }
        } catch (error) {
          console.error(`❌ Erro ao verificar oficina ${workshop.id}:`, error);
        }
      }
      
      console.log('🎯 Inscrições encontradas (fallback):', enrolled);
      return enrolled;
    } catch (error) {
      console.error('💥 Erro no fallback:', error);
      return [];
    }
  };

  const handleUnenrollClick = (workshop) => {
    setSelectedWorkshop(workshop);
    setDialogOpen(true);
  };

  const handleUnenrollConfirm = async () => {
    if (!selectedWorkshop) return;

    setUnenrolling(selectedWorkshop.id);
    setMessage('');

    try {
      await workshopsAPI.unenroll(selectedWorkshop.id);
      setMessage(`✅ Inscrição na oficina "${selectedWorkshop.title}" cancelada com sucesso!`);
      setDialogOpen(false);
      setSelectedWorkshop(null);
      
      // Recarregar a lista
      await fetchMyEnrollments();
    } catch (error) {
      console.error('❌ Erro ao cancelar inscrição:', error);
      setMessage(error.response?.data?.detail || 'Erro ao cancelar inscrição');
    } finally {
      setUnenrolling(null);
    }
  };

  const handleUnenrollCancel = () => {
    setDialogOpen(false);
    setSelectedWorkshop(null);
  };

  const handleViewDetails = (workshopId) => {
    router.push(`/workshops/${workshopId}`);
  };

  const handleRefresh = () => {
    fetchMyEnrollments();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'A definir';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <Layout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px" flexDirection="column">
          <CircularProgress />
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            Carregando suas inscrições...
          </Typography>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Minhas Inscrições
        </Typography>
        <Button 
          startIcon={<Refresh />}
          onClick={handleRefresh}
          variant="outlined"
        >
          Atualizar
        </Button>
      </Box>

      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        {enrolledWorkshops.length > 0 
          ? `Você está inscrito em ${enrolledWorkshops.length} oficina(s)`
          : 'Gerencie suas inscrições em oficinas'
        }
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

      {/* Informações de Debug */}
      {debugInfo && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Debug:</strong> {debugInfo} | User ID: {user?.id}
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        {enrolledWorkshops.map((workshop) => (
          <Grid item xs={12} md={6} key={workshop.id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: '2px solid #4caf50',
                position: 'relative'
              }}
            >
              <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                <Chip 
                  label="Inscrito" 
                  color="success" 
                  size="small"
                />
              </Box>

              <CardContent sx={{ flexGrow: 1, pt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  {workshop.title}
                </Typography>

                {workshop.theme && (
                  <Chip 
                    label={workshop.theme} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                )}

                <Typography variant="body2" color="textSecondary" paragraph>
                  {workshop.description && workshop.description.length > 120 
                    ? `${workshop.description.substring(0, 120)}...` 
                    : workshop.description || 'Sem descrição disponível.'}
                </Typography>

                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {workshop.start_date && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        <strong>Início:</strong> {formatDate(workshop.start_date)}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Group sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      <strong>Vagas totais:</strong> {workshop.max_students}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      <strong>Status:</strong> 
                      {workshop.is_published ? (
                        <Chip label="Publicada" color="primary" size="small" sx={{ ml: 1 }} />
                      ) : (
                        <Chip label="Rascunho" size="small" sx={{ ml: 1 }} />
                      )}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
              
              <CardActions>
                <Button 
                  size="small" 
                  startIcon={<Visibility />}
                  onClick={() => handleViewDetails(workshop.id)}
                >
                  Ver Detalhes
                </Button>
                <Button 
                  size="small" 
                  color="error"
                  startIcon={<Cancel />}
                  onClick={() => handleUnenrollClick(workshop)}
                  disabled={unenrolling === workshop.id}
                >
                  {unenrolling === workshop.id ? 'Cancelando...' : 'Cancelar Inscrição'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {enrolledWorkshops.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4, py: 6, border: '2px dashed #e0e0e0', borderRadius: 2 }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            Nenhuma inscrição encontrada
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            {user?.role === 'aluno' 
              ? 'Você ainda não se inscreveu em nenhuma oficina.'
              : 'Apenas alunos podem se inscrever em oficinas.'
            }
          </Typography>
          {user?.role === 'aluno' && (
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              onClick={() => router.push('/workshops/catalog')}
            >
              Explorar Oficinas
            </Button>
          )}
        </Box>
      )}

      {/* Dialog de Confirmação */}
      <Dialog
        open={dialogOpen}
        onClose={handleUnenrollCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Confirmar Cancelamento
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Tem certeza que deseja cancelar sua inscrição na oficina 
            <strong> "{selectedWorkshop?.title}"</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUnenrollCancel} disabled={unenrolling}>
            Manter Inscrição
          </Button>
          <Button 
            onClick={handleUnenrollConfirm} 
            color="error"
            variant="contained"
            disabled={unenrolling}
            autoFocus
          >
            {unenrolling ? 'Cancelando...' : 'Sim, Cancelar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default MyEnrollments;