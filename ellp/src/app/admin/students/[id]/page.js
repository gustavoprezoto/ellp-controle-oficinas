"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Typography,
  Paper,
  Box,
  Button,
  Chip,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  Tab,
  Tabs
} from '@mui/material';
import { 
  ArrowBack, 
  Edit, 
  Person, 
  Email, 
  CalendarToday,
  School,
  Assignment
} from '@mui/icons-material';
import { usersAPI, workshopsAPI } from '../../../../services/api';
import Layout from '../../../../components/Layout/Layout';
import { useAuth } from '../../../../contexts/AuthContext';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`student-tabpanel-${index}`}
      aria-labelledby={`student-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const StudentDetails = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [student, setStudent] = useState(null);
  const [enrolledWorkshops, setEnrolledWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [message, setMessage] = useState('');

  const studentId = params.id;

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchStudentData();
    }
  }, [user, studentId]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      
      // Buscar dados do aluno
      const studentResponse = await usersAPI.get(studentId);
      setStudent(studentResponse.data);
      
      // Buscar oficinas do aluno
      try {
        const enrollmentsResponse = await usersAPI.getStudentEnrollments(studentId);
        setEnrolledWorkshops(enrollmentsResponse.data);
      } catch (error) {
        console.error('Error fetching student enrollments:', error);
        // Fallback: buscar todas as oficinas e filtrar
        const allWorkshops = await workshopsAPI.getAll(true);
        const enrolled = [];
        for (const workshop of allWorkshops.data) {
          try {
            const studentsResponse = await workshopsAPI.getStudents(workshop.id);
            if (studentsResponse.data.some(s => s.id === parseInt(studentId))) {
              enrolled.push(workshop);
            }
          } catch (err) {
            console.error(`Error checking workshop ${workshop.id}:`, err);
          }
        }
        setEnrolledWorkshops(enrolled);
      }
      
    } catch (error) {
      console.error('Error fetching student data:', error);
      setMessage('Erro ao carregar dados do aluno');
    } finally {
      setLoading(false);
    }
  };

  const handleEditStudent = () => {
    router.push(`/admin/students/edit/${studentId}`);
  };

  const handleBack = () => {
    router.push('/admin/students');
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (user?.role !== 'admin') {
    return (
      <Layout>
        <Alert severity="error">
          Acesso negado. Apenas administradores podem acessar esta página.
        </Alert>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (!student) {
    return (
      <Layout>
        <Alert severity="error">
          Aluno não encontrado.
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Cabeçalho */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Voltar para Lista
        </Button>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              {student.name}
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Detalhes do aluno
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={handleEditStudent}
          >
            Editar Aluno
          </Button>
        </Box>
      </Box>

      {message && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {message}
        </Alert>
      )}

      <Paper>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Informações Gerais" />
          <Tab label={`Oficinas Inscritas (${enrolledWorkshops.length})`} />
        </Tabs>

        {/* Tab Informações Gerais */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person />
                    Informações Pessoais
                  </Typography>
                  
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Nome completo"
                        secondary={student.name}
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText
                        primary="Email"
                        secondary={student.email}
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText
                        primary="Tipo de usuário"
                        secondary={
                          <Chip 
                            label={student.role} 
                            color="primary" 
                            size="small" 
                          />
                        }
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarToday />
                    Informações da Conta
                  </Typography>
                  
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Status da conta"
                        secondary={
                          student.is_active ? 
                            <Chip label="Ativo" color="success" size="small" /> :
                            <Chip label="Inativo" color="error" size="small" />
                        }
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText
                        primary="Data de cadastro"
                        secondary={formatDate(student.created_at)}
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText
                        primary="ID do usuário"
                        secondary={student.id}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab Oficinas Inscritas */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <School />
            Oficinas Inscritas
          </Typography>

          {enrolledWorkshops.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Assignment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Nenhuma oficina inscrita
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Este aluno ainda não se inscreveu em nenhuma oficina.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {enrolledWorkshops.map((workshop) => (
                <Grid item xs={12} md={6} key={workshop.id}>
                  <Card variant="outlined">
                    <CardContent>
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
                      
                      <Typography variant="body2" color="textSecondary" paragraph>
                        {workshop.description && workshop.description.length > 100 
                          ? `${workshop.description.substring(0, 100)}...` 
                          : workshop.description}
                      </Typography>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography variant="body2">
                          <strong>Status:</strong> 
                          {workshop.is_published ? 
                            <Chip label="Publicada" color="success" size="small" sx={{ ml: 1 }} /> : 
                            <Chip label="Rascunho" size="small" sx={{ ml: 1 }} />
                          }
                        </Typography>
                        
                        {workshop.start_date && (
                          <Typography variant="body2">
                            <strong>Início:</strong> {formatDate(workshop.start_date)}
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>
      </Paper>
    </Layout>
  );
};

export default StudentDetails;