"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  Alert,
  TextField
} from "@mui/material";
import { workshopsAPI } from "../../../services/api";
import Layout from "../../../components/Layout/Layout";
import { useAuth } from "../../../app/contexts/AuthContext";
import Link from "next/link";

export default function WorkshopDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const id = params.id;
  const [workshop, setWorkshop] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ---------- PRESENÇA ----------
  const [attendance, setAttendance] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);

  useEffect(() => {
    if (id) {
      fetchWorkshopData();
      fetchAttendance();
    }
  }, [id]);

  const fetchWorkshopData = async () => {
    try {
      setLoading(true);
      const workshopResponse = await workshopsAPI.get(id);
      setWorkshop(workshopResponse.data);

      if (user && (user.role === "professor" || user.role === "admin")) {
        try {
          const studentsResponse = await workshopsAPI.getStudents(id);
          setStudents(studentsResponse.data);
        } catch (error) {
          console.error("Error fetching students:", error);
        }
      }
    } catch (error) {
      console.error("Error fetching workshop:", error);
      setError("Erro ao carregar dados da oficina");
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoadingAttendance(true);
      const res = await workshopsAPI.getAttendance(id);
      console.log("attendence:")
      console.log(res.data);
      setAttendance(res.data);
    } catch (e) {
      console.error("Erro ao carregar presenças:", e);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleAttendanceChange = (studentId, field, value) => {
    setAttendance((prev) =>
      prev.map((a) =>
        a.student_id === studentId ? { ...a, [field]: Number(value) } : a
      )
    );
  };

  const handleSaveAttendance = async () => {
    try {
      setSavingAttendance(true);

      await workshopsAPI.updateAttendance(id, {
        students: attendance.map((entry) => ({
          student_id: entry.student_id,
          total_classes: entry.total_classes,
          absences: entry.absences,
        })),
      });

      alert("Presenças atualizadas com sucesso!");
      fetchAttendance();
    } catch (e) {
      console.error("Erro ao salvar presença:", e);
      alert("Erro ao salvar presença.");
    } finally {
      setSavingAttendance(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Não definida";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isProfessor =
    workshop &&
    user &&
    (workshop.professor_id === user.id || user.role === "admin");

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
        {/* PAINEL PRINCIPAL */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
              <Typography variant="h4">{workshop.title}</Typography>

              <Box>
                <Chip
                  label={workshop.is_published ? "Publicada" : "Rascunho"}
                  color={workshop.is_published ? "success" : "default"}
                  sx={{ mr: 1 }}
                />
                {workshop.is_completed && (
                  <Chip label="Concluída" color="primary" variant="outlined" />
                )}
              </Box>
            </Box>

            {/* resto do painel mantido igual */}
            {/* ... */}
            
            <Box sx={{ mt: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
              {isProfessor && (
                <>
                  <Link href={`/workshops/edit/${workshop.id}`} passHref legacyBehavior>
                    <Button variant="contained" color="primary">
                      Editar Oficina
                    </Button>
                  </Link>
                  

                  {!workshop.is_completed && (
                    <Button
                      variant="contained"
                      color="success"
                      onClick={async () => {
                        try {
                          await workshopsAPI.complete(workshop.id);
                          window.location.reload();
                        } catch (error) {
                          console.error("Error completing workshop:", error);
                        }
                      }}
                    >
                      Marcar como Concluída
                    </Button>
                  )}

                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => router.push("/workshops/my-workshops")}
                  >
                    Voltar para Minhas Oficinas
                  </Button>
                </>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* SIDEBAR */}
        <Grid item xs={12} md={4}>

          {/* LISTA DE ALUNOS */}
          {isProfessor && students.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6">Alunos Inscritos ({students.length})</Typography>
                <List dense>
                  {students.map((student, index) => (
                    <React.Fragment key={student.id}>
                      <ListItem>
                        <ListItemText primary={student.name} secondary={student.email} />
                      </ListItem>
                      {index < students.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}

          {/* ---------- CONTROLE DE PRESENÇA ---------- */}
          {isProfessor && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Controle de Presença
                </Typography>

                {loadingAttendance && <CircularProgress size={22} />}

                {!loadingAttendance && attendance.length === 0 && (
                  <Typography>Nenhum aluno matriculado.</Typography>
                )}

                {!loadingAttendance &&
                  attendance.length > 0 &&
                  attendance.map((a) => (
                    <Box key={a.student_id} sx={{ mb: 2 }}>
                      <Typography sx={{ fontWeight: "bold" }}>{a.student_name}</Typography>

                      <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                        <TextField
                          label="Aulas dadas"
                          type="number"
                          size="small"
                          value={a.total_classes}
                          onChange={(e) =>
                            handleAttendanceChange(
                              a.student_id,
                              "total_classes",
                              e.target.value
                            )
                          }
                        />

                        <TextField
                          label="Faltas"
                          type="number"
                          size="small"
                          value={a.absences}
                          onChange={(e) =>
                            handleAttendanceChange(
                              a.student_id,
                              "absences",
                              e.target.value
                            )
                          }
                        />
                      </Box>

                      <Typography sx={{ mt: 1 }}>
                        Presença: {Math.round(a.presence_percentage * 100)}%
                      </Typography>

                      <Divider sx={{ mt: 1 }} />
                    </Box>
                  ))}

                {attendance.length > 0 && (
                  <Button
                    fullWidth
                    variant="contained"
                    sx={{ mt: 2 }}
                    disabled={savingAttendance}
                    onClick={handleSaveAttendance}
                  >
                    {savingAttendance ? "Salvando..." : "Salvar Presenças"}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* INFOS DO PROFESSOR */}
          <Card>
            <CardContent>
              <Typography variant="h6">Informações do Professor</Typography>
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
