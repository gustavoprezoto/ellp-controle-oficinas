'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Typography,
  Paper,
  Box,
  Chip,
  Button,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import { workshopsAPI } from '../../../services/api';
import Layout from '../../../components/Layout/Layout';
import { useAuth } from '../../../app/contexts/AuthContext';
import Link from 'next/link';

export default function WorkshopDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const id = params.id;
  const [workshop, setWorkshop] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchWorkshopData();
    }
  }, [id]);

  const fetchWorkshopData = async () => {
    try {
      setLoading(true);
      const workshopResponse = await workshopsAPI.get(id);
      setWorkshop(workshopResponse.data);

      // Se o usuário é o professor ou admin, buscar lista de alunos
      if (user && (user.role === 'professor' || user.role === 'admin')) {
        try {
          const studentsResponse = await workshopsAPI.getStudents(id);
          setStudents(studentsResponse.data);
        } catch (error) {
          console.error('Error fetching students:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching workshop:', error);
      setError('Erro ao carregar dados da oficina');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Não definida';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isProfessor = workshop && user && (workshop.professor_id === user.id || user.role === 'admin');

  if (loading) {
    return (
      <Layout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Alert severity="error">{error}</Alert>
      </Layout>
    );
  }

  if (!workshop) {
    return (
      <Layout>
        <Alert severity="warning">Oficina não encontrada</Alert>
      </Layout>
    );
  }

  return (
    <Layout>
      <Grid container spacing={3}>
        {/* Informações da Oficina */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="h4" gutterBottom>
                {workshop.title}
              </Typography>
              
              <Box>
                <Chip 
                  label={workshop.is_published ? 'Publicada' : 'Rascunho'} 
                  color={workshop.is_published ? 'success' : 'default'}
                  sx={{ mr: 1 }}
                />
                {workshop.is_completed && (
                  <Chip label="Concluída" color="primary" variant="outlined" />
                )}
              </Box>
            </Box>

            {workshop.theme && (
              <Chip 
                label={workshop.theme} 
                color="primary" 
                variant="outlined"
                sx={{ mb: 2 }}
              />
            )}

            {workshop.description && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Descrição
                </Typography>
                <Typography variant="body1" paragraph>
                  {workshop.description}
                </Typography>
              </Box>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" color="textSecondary">
                  Data de Início
                </Typography>
                <Typography variant="body1">
                  {formatDate(workshop.start_date)}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" color="textSecondary">
                  Data de Término
                </Typography>
                <Typography variant="body1">
                  {formatDate(workshop.end_date)}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" color="textSecondary">
                  Vagas Disponíveis
                </Typography>
                <Typography variant="body1">
                  {workshop.max_students} vagas
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" color="textSecondary">
                  Data de Criação
                </Typography>
                <Typography variant="body1">
                  {formatDate(workshop.created_at)}
                </Typography>
              </Grid>
            </Grid>

            {workshop.prerequisites && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Pré-requisitos
                </Typography>
                <Typography variant="body1">
                  {workshop.prerequisites}
                </Typography>
              </Box>
            )}

            {workshop.schedule && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Cronograma
                </Typography>
                <Typography 
                  variant="body1" 
                  component="pre" 
                  sx={{ 
                    fontFamily: 'inherit',
                    backgroundColor: 'grey.100',
                    p: 2,
                    borderRadius: 1,
                    overflow: 'auto'
                  }}
                >
                  {workshop.schedule}
                </Typography>
              </Box>
            )}

            {/* Botões de Ação */}
            <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {isProfessor && (
                <>
                  <Link href={`/workshops/edit/${workshop.id}`} passHref legacyBehavior>
                    <Button variant="contained" color="primary">
                      Editar Oficina
                    </Button>
                  </Link>
                  
                  <Button 
                    variant="outlined" 
                    color="secondary"
                    onClick={() => router.push('/workshops/my-workshops')}
                  >
                    Voltar para Minhas Oficinas
                  </Button>
                </>
              )}

              {user?.role === 'aluno' && (
                <Button 
                  variant="outlined" 
                  onClick={() => router.push('/workshops/catalog')}
                >
                  Voltar para Catálogo
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Sidebar - Informações Adicionais */}
        <Grid item xs={12} md={4}>
          {/* Lista de Alunos (apenas para professor/admin) */}
          {isProfessor && students.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Alunos Inscritos ({students.length})
                </Typography>
                <List dense>
                  {students.map((student, index) => (
                    <React.Fragment key={student.id}>
                      <ListItem>
                        <ListItemText
                          primary={student.name}
                          secondary={student.email}
                        />
                      </ListItem>
                      {index < students.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}

          {/* Informações do Professor */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informações do Professor
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Esta oficina é ministrada pelo professor responsável.
              </Typography>
              
              {isProfessor && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Seu ID:</strong> {user.id}
                  </Typography>
                  <Typography variant="body2">
                    <strong>ID da Oficina:</strong> {workshop.id}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Layout>
  );
}