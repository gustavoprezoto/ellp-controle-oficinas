'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Box,
  IconButton,
  CircularProgress
} from '@mui/material';
import { Edit, Visibility, Delete } from '@mui/icons-material';
import { workshopsAPI } from '../../../services/api';
import Layout from '../../../components/Layout/Layout';
import Link from 'next/link';

export default function MyWorkshopsPage() {
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchWorkshops();
  }, []);

  const fetchWorkshops = async () => {
    try {
      const response = await workshopsAPI.getMyWorkshops();
      setWorkshops(response.data);
    } catch (error) {
      console.error('Error fetching workshops:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (workshopId) => {
    if (window.confirm('Tem certeza que deseja excluir esta oficina?')) {
      try {
        await workshopsAPI.delete(workshopId);
        fetchWorkshops();
      } catch (error) {
        console.error('Error deleting workshop:', error);
        alert('Erro ao excluir oficina');
      }
    }
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Minhas Oficinas
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => router.push('/workshops/create')}
        >
          Nova Oficina
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Título</TableCell>
              <TableCell>Tema</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Vagas</TableCell>
              <TableCell>Data de Criação</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {workshops.map((workshop) => (
              <TableRow key={workshop.id}>
                <TableCell>{workshop.title}</TableCell>
                <TableCell>{workshop.theme}</TableCell>
                <TableCell>
                  <Chip 
                    label={workshop.is_published ? 'Publicada' : 'Rascunho'} 
                    color={workshop.is_published ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{workshop.max_students}</TableCell>
                <TableCell>
                  {new Date(workshop.created_at).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell>
                  <IconButton 
                    size="small" 
                    onClick={() => router.push(`/workshops/${workshop.id}`)}
                  >
                    <Visibility />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={() => router.push(`/workshops/edit/${workshop.id}`)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={() => handleDelete(workshop.id)}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {workshops.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="textSecondary">
            Você ainda não criou nenhuma oficina
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            sx={{ mt: 2 }}
            onClick={() => router.push('/workshops/create')}
          >
            Criar Primeira Oficina
          </Button>
        </Box>
      )}
    </Layout>
  );
}