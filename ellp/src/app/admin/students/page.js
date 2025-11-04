"use client";
import React, { useState, useEffect } from "react";
import {
  Typography,
  Paper,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Person,
  Email,
  School,
} from "@mui/icons-material";
import { usersAPI } from "../../../services/api";
import Layout from "../../../components/Layout/Layout";
import { useAuth } from "../../../app/contexts/AuthContext";
import { useRouter } from "next/navigation";

const StudentsManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "aluno",
  });
  const [formErrors, setFormErrors] = useState({});
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchStudents();
    }
  }, [user]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      // Usar o endpoint específico para alunos
      const response = await usersAPI.getStudents();
      setStudents(response.data);
    } catch (error) {
      console.error("Error fetching students:", error);
      // Fallback: buscar todos os usuários e filtrar
      try {
        const allUsersResponse = await usersAPI.getAll();
        const alunos = allUsersResponse.data.filter(
          (user) => user.role === "aluno"
        );
        setStudents(alunos);
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
        setMessage("Erro ao carregar lista de alunos");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (student = null) => {
    if (student) {
      setFormData({
        name: student.name,
        email: student.email,
        password: "",
        role: student.role,
      });
      setSelectedStudent(student);
    } else {
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "aluno",
      });
      setSelectedStudent(null);
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedStudent(null);
    setFormErrors({});
  };

  const handleOpenDeleteDialog = (student) => {
    setSelectedStudent(student);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedStudent(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Limpar erro do campo quando usuário começar a digitar
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = "Nome é obrigatório";
    }

    if (!formData.email.trim()) {
      errors.email = "Email é obrigatório";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email inválido";
    }

    if (!selectedStudent && !formData.password) {
      errors.password = "Senha é obrigatória para novo aluno";
    } else if (formData.password && formData.password.length < 6) {
      errors.password = "Senha deve ter pelo menos 6 caracteres";
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
      setMessage("");

      if (selectedStudent) {
        // Atualizar aluno existente
        const updateData = {
          name: formData.name,
          email: formData.email,
        };

        // Só inclui a senha se foi preenchida
        if (formData.password) {
          updateData.password = formData.password;
        }

        await usersAPI.update(selectedStudent.id, updateData);
        setMessage("Aluno atualizado com sucesso!");
      } else {
        // Criar novo aluno
        await usersAPI.create(formData);
        setMessage("Aluno criado com sucesso!");
      }

      handleCloseDialog();
      fetchStudents();
    } catch (error) {
      console.error("Error saving student:", error);
      setMessage(error.response?.data?.detail || "Erro ao salvar aluno");
    }
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;

    try {
      await usersAPI.delete(selectedStudent.id);
      setMessage("Aluno excluído com sucesso!");
      handleCloseDeleteDialog();
      fetchStudents();
    } catch (error) {
      console.error("Error deleting student:", error);
      setMessage(error.response?.data?.detail || "Erro ao excluir aluno");
    }
  };

  const handleViewDetails = (studentId) => {
    router.push(`/admin/students/${studentId}`);
  };

  const getStatusChip = (student) => {
    return student.is_active ? (
      <Chip label="Ativo" color="success" size="small" />
    ) : (
      <Chip label="Inativo" color="error" size="small" />
    );
  };

  const getStudentStats = () => {
    const total = students.length;
    const active = students.filter((s) => s.is_active).length;
    const inactive = total - active;

    return { total, active, inactive };
  };

  const stats = getStudentStats();

  if (user?.role !== "admin") {
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
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="200px"
        >
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Gerenciamento de Alunos
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Gerencie os alunos do sistema ELLP
        </Typography>
      </Box>

      {message && (
        <Alert
          severity={message.includes("sucesso") ? "success" : "error"}
          sx={{ mb: 3 }}
          onClose={() => setMessage("")}
        >
          {message}
        </Alert>
      )}

      {/* Estatísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Person sx={{ fontSize: 48, color: "primary.main", mb: 1 }} />
              <Typography variant="h4" color="primary.main">
                {stats.total}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total de Alunos
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <School sx={{ fontSize: 48, color: "success.main", mb: 1 }} />
              <Typography variant="h4" color="success.main">
                {stats.active}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Alunos Ativos
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Email sx={{ fontSize: 48, color: "error.main", mb: 1 }} />
              <Typography variant="h4" color="error.main">
                {stats.inactive}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Alunos Inativos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Barra de Ações */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h6">
          Lista de Alunos ({students.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Novo Aluno
        </Button>
      </Box>

      {/* Tabela de Alunos */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Data de Cadastro</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {student.name}
                  </Typography>
                </TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell>{getStatusChip(student)}</TableCell>
                <TableCell>
                  {new Date(student.created_at).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleViewDetails(student.id)}
                    title="Ver detalhes"
                  >
                    <Visibility />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="secondary"
                    onClick={() => handleOpenDialog(student)}
                    title="Editar aluno"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleOpenDeleteDialog(student)}
                    title="Excluir aluno"
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {students.length === 0 && (
        <Box sx={{ textAlign: "center", mt: 4, py: 6 }}>
          <Person sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            Nenhum aluno cadastrado
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Comece cadastrando o primeiro aluno no sistema.
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Cadastrar Primeiro Aluno
          </Button>
        </Box>
      )}

      {/* Dialog de Adicionar/Editar Aluno */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedStudent ? "Editar Aluno" : "Novo Aluno"}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Nome completo"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.name}
              onChange={handleInputChange}
              error={!!formErrors.name}
              helperText={formErrors.name}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="email"
              label="Email"
              type="email"
              fullWidth
              variant="outlined"
              value={formData.email}
              onChange={handleInputChange}
              error={!!formErrors.email}
              helperText={formErrors.email}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="password"
              label="Senha"
              type="password"
              fullWidth
              variant="outlined"
              value={formData.password}
              onChange={handleInputChange}
              error={!!formErrors.password}
              helperText={
                formErrors.password ||
                (selectedStudent
                  ? "Deixe em branco para manter a senha atual"
                  : "Mínimo 6 caracteres")
              }
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button type="submit" variant="contained">
              {selectedStudent ? "Atualizar" : "Cadastrar"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir o aluno{" "}
            <strong>{selectedStudent?.name}</strong>?
            <br />
            <br />
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancelar</Button>
          <Button
            onClick={handleDeleteStudent}
            color="error"
            variant="contained"
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default StudentsManagement;
