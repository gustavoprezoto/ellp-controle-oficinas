import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/DashBoard';
import CreateWorkshop from './app/workshops/CreateWorkshop';
import './App.css';

function App() {
  // Aqui você pode adicionar a lógica para verificar se o usuário está autenticado
  const isAuthenticated = false; // Por enquanto, vamos deixar como true

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          !isAuthenticated ? <Login /> : <Navigate to="/" />
        } />
        <Route path="/" element={
          isAuthenticated ? <Dashboard /> : <Navigate to="/login" />
        } />
        <Route path="/cadastro-oficina" element={
          isAuthenticated ? <CreateWorkshop /> : <Navigate to="/login" />
        } />
      </Routes>
    </Router>
  );
}

export default App;
