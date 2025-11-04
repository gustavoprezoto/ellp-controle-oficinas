"use client";
import React from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  CircularProgress,
} from "@mui/material";
import { Assignment, Book, Group, List, ExitToApp } from "@mui/icons-material";
import { useAuth } from "../../app/contexts/AuthContext";
import Layout from "../../components/Layout/Layout";
import { useRouter } from "next/navigation";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Mostrar loading enquanto verifica autenticação
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

  // Se não há usuário, não mostrar o dashboard
  if (!user) {
    return (
      <Layout>
        <Typography variant="h6" color="error">
          Você precisa estar logado para acessar esta página.
        </Typography>
      </Layout>
    );
  }

  return (
    <Layout>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Typography variant="h6" color="textSecondary" gutterBottom>
        Bem-vindo, {user.name}!
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Cards para Alunos */}
        {user.role === "aluno" && (
          <>
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent sx={{ textAlign: "center" }}>
                  <Book sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Catálogo de Oficinas
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    Explore e inscreva-se em oficinas disponíveis
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => router.push("/workshops/catalog")}
                  >
                    Explorar
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent sx={{ textAlign: "center" }}>
                  <List sx={{ fontSize: 48, color: "success.main", mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Minhas Inscrições
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    Veja e gerencie suas inscrições ativas
                  </Typography>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => router.push("/student/enrollments")}
                  >
                    Minhas Inscrições
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent sx={{ textAlign: "center" }}>
                  <Assignment
                    sx={{ fontSize: 48, color: "info.main", mb: 2 }}
                  />
                  <Typography variant="h6" gutterBottom>
                    Meu Histórico
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    Acompanhe suas oficinas concluídas e certificados
                  </Typography>
                  <Button
                    variant="outlined"
                    color="info"
                    onClick={() => router.push("/student/history")}
                  >
                    Ver Histórico
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}

        {/* Cards para Professores/Admin */}
        {(user.role === "professor" || user.role === "admin") && (
          <>
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent sx={{ textAlign: "center" }}>
                  <Assignment
                    sx={{ fontSize: 48, color: "primary.main", mb: 2 }}
                  />
                  <Typography variant="h6" gutterBottom>
                    Minhas Oficinas
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    Gerencie as oficinas que você ministra
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => router.push("/workshops/my-workshops")}
                  >
                    Acessar
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent sx={{ textAlign: "center" }}>
                  <Book sx={{ fontSize: 48, color: "secondary.main", mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Criar Oficina
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    Crie uma nova oficina para os alunos
                  </Typography>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => router.push("/workshops/create")}
                  >
                    Criar
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}

        {/* Cards para Admin */}
        {user.role === "admin" && (
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: "100%" }}>
              <CardContent sx={{ textAlign: "center" }}>
                <Group sx={{ fontSize: 48, color: "warning.main", mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Gerenciar Alunos
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Cadastre e gerencie alunos do sistema
                </Typography>
                <Button
                  variant="contained"
                  color="warning"
                  onClick={() => router.push("/admin/students")}
                >
                  Gerenciar
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Card de Ações Rápidas */}
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: "100%", border: "1px dashed #ccc" }}>
            <CardContent sx={{ textAlign: "center" }}>
              <ExitToApp sx={{ fontSize: 48, color: "grey.500", mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Ações Rápidas
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Acesse rapidamente funcionalidades importantes
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {user.role === "aluno" && (
                  <>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => router.push("/workshops/catalog")}
                    >
                      Buscar Oficinas
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => router.push("/student/enrollments")}
                    >
                      Ver Minhas Inscrições
                    </Button>
                  </>
                )}

                {(user.role === "professor" || user.role === "admin") && (
                  <>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => router.push("/workshops/create")}
                    >
                      Nova Oficina
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => router.push("/workshops/my-workshops")}
                    >
                      Ver Minhas Oficinas
                    </Button>
                  </>
                )}

                {user.role === "admin" && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => router.push("/users")}
                  >
                    Gerenciar Usuários
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Seção de Estatísticas Rápidas (opcional) */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Resumo
        </Typography>
        <Grid container spacing={2}>
          {user.role === "aluno" && (
            <>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Inscrições Ativas
                    </Typography>
                    <Typography variant="h4">0</Typography>
                    <Button
                      size="small"
                      onClick={() => router.push("/student/enrollments")}
                      sx={{ mt: 1 }}
                    >
                      Ver Todas
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Oficinas Concluídas
                    </Typography>
                    <Typography variant="h4">0</Typography>
                    <Button
                      size="small"
                      onClick={() => router.push("/student/history")}
                      sx={{ mt: 1 }}
                    >
                      Ver Histórico
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}

          {(user.role === "professor" || user.role === "admin") && (
            <>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Minhas Oficinas
                    </Typography>
                    <Typography variant="h4">0</Typography>
                    <Button
                      size="small"
                      onClick={() => router.push("/workshops/my-workshops")}
                      sx={{ mt: 1 }}
                    >
                      Gerenciar
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Alunos Ativos
                    </Typography>
                    <Typography variant="h4">0</Typography>
                    <Button
                      size="small"
                      onClick={() => router.push("/workshops/my-workshops")}
                      sx={{ mt: 1 }}
                    >
                      Ver Detalhes
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}

          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Próximas Atividades
                </Typography>
                <Typography variant="h4">0</Typography>
                <Button
                  size="small"
                  onClick={() => router.push("/calendar")}
                  sx={{ mt: 1 }}
                >
                  Ver Calendário
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Layout>
  );
};

export default Dashboard;
