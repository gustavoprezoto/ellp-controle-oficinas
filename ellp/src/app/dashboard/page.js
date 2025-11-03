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
import { useAuth } from "../../app/contexts/AuthContext";
import Layout from "../../components/Layout/Layout";
import Link from "next/link";

const DashboardPage = () => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <Layout>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="200px"
        >
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Typography variant="h6" color="textSecondary" gutterBottom>
        Bem-vindo, {"João"}!
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {(user?.role === "professor" || user?.role === "admin") && (
          <>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Minhas Oficinas
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    Gerencie as oficinas que você ministra
                  </Typography>
                  <Link href="/workshops/my-workshops" passHref>
                    <Button variant="contained" color="primary">
                      Acessar
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Criar Oficina
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    Crie uma nova oficina
                  </Typography>
                  <Link href="/workshops/create" passHref>
                    <Button variant="contained" color="primary">
                      Criar
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}

        {user?.role === "aluno" && (
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Catálogo de Oficinas
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Explore e inscreva-se em oficinas disponíveis
                </Typography>
                <Link href="/workshops/catalog" passHref>
                  <Button variant="contained" color="primary">
                    Explorar
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </Grid>
        )}

        {user?.role === "admin" && (
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Gerenciar Usuários
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Cadastre e gerencie usuários do sistema
                </Typography>
                <Button variant="contained" color="primary" disabled>
                  Em Breve
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Layout>
  );
};

export default DashboardPage;
