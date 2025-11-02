"use client"; // ← Adicione esta linha no topo

import React, { useState } from 'react';
import {
  Typography,
  TextField,
  Button,
  Paper,
  Box,
  FormControlLabel,
  Checkbox,
  Alert
} from '@mui/material';
import { workshopsAPI } from '../../../services/api';
import Layout from '../../../components/Layout/Layout';
import { useRouter } from 'next/navigation'; // ← Mudou para next/navigation

const CreateWorkshop = () => {
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter(); // ← Agora vem de next/navigation

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

    try {
      await workshopsAPI.create(formData);
      router.push('/workshops/my-workshops');
    } catch (error) {
      setError(error.response?.data?.detail || 'Erro ao criar oficina');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Criar Nova Oficina
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
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

          <TextField
            fullWidth
            label="Cronograma (JSON)"
            name="schedule"
            value={formData.schedule}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={3}
            placeholder='{"dias": ["segunda", "quarta"], "horario": "14:00-16:00"}'
          />

          <FormControlLabel
            control={
              <Checkbox
                name="is_published"
                checked={formData.is_published}
                onChange={handleChange}
              />
            }
            label="Publicar oficina"
            sx={{ mt: 2 }}
          />

          <Box sx={{ mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{ mr: 2 }}
            >
              {loading ? 'Criando...' : 'Criar Oficina'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => router.push('/workshops/my-workshops')}
            >
              Cancelar
            </Button>
          </Box>
        </Box>
      </Paper>
    </Layout>
  );
};

export default CreateWorkshop;