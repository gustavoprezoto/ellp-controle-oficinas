'use client';
import React, { useState, useEffect } from 'react';
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
  IconButton
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import { workshopsAPI } from '../../../services/api';
import Layout from '../../../components/Layout/Layout';
import Link from 'next/link';

const MyWorkshops = () => {
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);

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
        // Implementar delete
        await workshopsAPI.delete(workshopId);
        fetchWorkshops();
      } catch (error) {
        console.error('Error deleting workshop:', error);
      }
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Minhas Oficinas
        </Typography>
        <Link href="/workshops/create" passHref>
          <Button variant="contained" color="primary">
            Nova Oficina
          </Button>
        </Link>
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
                    component={Link} 
                    href={`/workshops/${workshop.id}`}
                  >
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    component={Link} 
                    href={`/workshops/${workshop.id}/edit`}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={() => handleDelete(workshop.id)}
                    color="error"
                  >
                    <DeleteIcon />
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
          <Link href="/workshops/create" passHref>
            <Button variant="contained" color="primary" sx={{ mt: 2 }}>
              Criar Primeira Oficina
            </Button>
          </Link>
        </Box>
      )}
    </Layout>
  );
};

export default MyWorkshops;