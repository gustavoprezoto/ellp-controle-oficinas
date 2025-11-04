'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Typography,
  TextField,
  Button,
  Paper,
  Box,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress
} from '@mui/material';
import { workshopsAPI } from '../../../../services/api';
import Layout from '../../../../components/Layout/Layout';

export default function EditWorkshopPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    theme: '',
    max_students: 20,
    prerequisites: '',
    start_date: '',
    end_date: '',
    schedule: '',
    is_published: false
  });
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Buscar dados da oficina
  useEffect(() => {
    if (id) {
      fetchWorkshop();
    }
  }, [id]);

  const fetchWorkshop = async () => {
    try {
      setFetching(true);
      const response = await workshopsAPI.get(id);
      const workshop = response.data;
      
      // Format dates for datetime-local input
      const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16);
      };

      setFormData({
        title: workshop.title || '',
        description: workshop.description || '',
        theme: workshop.theme || '',
        max_students: workshop.max_students || 20,
        prerequisites: workshop.prerequisites || '',
        start_date: formatDateForInput(workshop.start_date),
        end_date: formatDateForInput(workshop.end_date),
        schedule: workshop.schedule || '',
        is_published: workshop.is_published || false
      });
    } catch (error) {
      console.error('Error fetching workshop:', error);
      setError('Erro ao carregar oficina');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Preparar dados para envio
      const submitData = {
        ...formData,
        max_students: parseInt(formData.max_students),
        // Converter datas de volta para formato ISO
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null
      };

      await workshopsAPI.update(id, submitData);
      setSuccess('Oficina atualizada com sucesso!');
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        router.push('/workshops/my-workshops');
      }, 2000);
      
    } catch (error) {
      console.error('Error updating workshop:', error);
      setError(error.response?.data?.detail || 'Erro ao atualizar oficina');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
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
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Editar Oficina
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Título"
            name="title"
            value={formData.title}
            onChange={handleChange}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Descrição"
            name="description"
            value={formData.description}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={4}
          />

          <TextField
            fullWidth
            label="Tema"
            name="theme"
            value={formData.theme}
            onChange={handleChange}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Número máximo de alunos"
            name="max_students"
            type="number"
            value={formData.max_students}
            onChange={handleChange}
            margin="normal"
            inputProps={{ min: 1 }}
          />

          <TextField
            fullWidth
            label="Pré-requisitos"
            name="prerequisites"
            value={formData.prerequisites}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={2}
          />

          <TextField
            fullWidth
            label="Data de Início"
            name="start_date"
            type="datetime-local"
            value={formData.start_date}
            onChange={handleChange}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            fullWidth
            label="Data de Término"
            name="end_date"
            type="datetime-local"
            value={formData.end_date}
            onChange={handleChange}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />

          {/* <TextField
            fullWidth
            label="Cronograma (JSON)"
            name="schedule"
            value={formData.schedule}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={3}
            placeholder='{"dias": ["segunda", "quarta"], "horario": "14:00-16:00"}'
            helperText="Formato JSON com dias da semana e horários"
          /> */}

          <FormControlLabel
            control={
              <Checkbox
                name="is_published"
                checked={formData.is_published}
                onChange={handleChange}
              />
            }
            label="Publicar oficina"
            sx={{ mt: 2, display: 'block' }}
          />

          <Box sx={{ mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{ mr: 2 }}
            >
              {loading ? 'Atualizando...' : 'Atualizar Oficina'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => router.push('/workshops/my-workshops')}
              disabled={loading}
            >
              Cancelar
            </Button>
          </Box>
        </Box>
      </Paper>
    </Layout>
  );
}