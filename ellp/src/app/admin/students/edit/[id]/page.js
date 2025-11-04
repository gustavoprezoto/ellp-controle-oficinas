"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Typography,
  Paper,
  Box,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Switch,
  FormControlLabel
} from '@mui/material';
import { ArrowBack, Save, Cancel } from '@mui/icons-material';
import { usersAPI } from '../../../../../services/api';
import Layout from '../../../../../components/Layout/Layout';
import { useAuth } from '../../../../../contexts/AuthContext';

const EditStudent = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    is_active: true
  });
  const [formErrors, setFormErrors] = useState({});

  const studentId = params.id;

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchStudent();
    }
  }, [user, studentId]);

  const fetchStudent = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.get(studentId);
      const studentData = response.data;
      setStudent(studentData);
      
      setFormData({
        name: studentData.name,
        email: studentData.email,
        password: '',
        is_active: studentData.is_active
      });
    } catch (error) {
      console.error('Error fetching student:', error);
      setMessage('Erro ao carregar dados do aluno');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Limpar erro do campo quando usuário começar a digitar
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email inválido';
    }
    
    if (formData.password && formData.password.length < 6) {
      errors.password = 'Senha deve ter pelo menos 6 caracteres';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setMessage('');
      
      const updateData = {
        name: formData.name,
        email: formData.email,
        is_active: formData.is_active
      };
      
      // Só inclui a senha se foi preenchida
      if (formData.password) {
        updateData.password = formData.password;
      }
      
      await usersAPI.update(studentId, updateData);
      setMessage('Aluno atualizado com sucesso!');
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        router.push('/admin/students');
      }, 2000);
      
    } catch (error) {
      console.error('Error updating student:', error);
      setMessage(error.response?.data?.detail || 'Erro ao atualizar aluno');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/students');
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
          onClick={handleCancel}
          sx={{ mb: 2 }}
        >
          Voltar para Lista
        </Button>
        
        <Typography variant="h4" gutterBottom>
          Editar Aluno
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Editando: {student.name}
        </Typography>
      </Box>

      {message && (
        <Alert 
          severity={message.includes('sucesso') ? 'success' : 'error'} 
          sx={{ mb: 3 }}
        >
          {message}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Nome completo"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                margin="normal"
                error={!!formErrors.name}
                helperText={formErrors.name}
                required
              />
              
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                margin="normal"
                error={!!formErrors.email}
                helperText={formErrors.email}
                required
              />
              
              <TextField
                fullWidth
                label="Nova senha"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                margin="normal"
                error={!!formErrors.password}
                helperText={formErrors.password || "Deixe em branco para manter a senha atual"}
              />

              <FormControlLabel
                control={
                  <Switch
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    color="primary"
                  />
                }
                label="Usuário ativo"
                sx={{ mt: 2, display: 'block' }}
              />

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<Save />}
                  disabled={saving}
                >
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Cancel />}
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancelar
                </Button>
              </Box>
            </form>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informações do Aluno
              </Typography>
              
              <Typography variant="body2" color="textSecondary" paragraph>
                <strong>ID:</strong> {student.id}
              </Typography>
              
              <Typography variant="body2" color="textSecondary" paragraph>
                <strong>Data de cadastro:</strong> {new Date(student.created_at).toLocaleDateString('pt-BR')}
              </Typography>
              
              <Typography variant="body2" color="textSecondary">
                <strong>Status atual:</strong> {student.is_active ? 'Ativo' : 'Inativo'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Layout>
  );
};

export default EditStudent;