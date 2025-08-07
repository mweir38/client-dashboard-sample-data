import React from "react";
import { Box, ThemeProvider, CssBaseline } from "@mui/material";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import vmoTheme from "./theme/vmoTheme";
import { NotificationProvider } from "./contexts/NotificationContext";
import Login from "./components/Login";
import CustomerDetail from "./components/CustomerDetail";
import Dashboard from "./components/Dashboard";
import AdminDashboard from "./components/AdminDashboard";
import ClientDashboard from "./components/ClientDashboard";
import ReportingEngine from "./components/ReportingEngine";
import AIInsights from "./components/AIInsights";
import ErrorBoundary from "./components/ErrorBoundary";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import HomeRedirect from "./components/HomeRedirect";

function App() {
  return (
    <ThemeProvider theme={vmoTheme}>
      <CssBaseline />
      <NotificationProvider>
        <Router>
          <Box sx={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0a1929 0%, #1e3a8a 100%)',
            p: 0
          }}>
            <Routes>
              <Route path="/" element={<HomeRedirect />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } />
              <Route path="/client-dashboard" element={
                <PrivateRoute>
                  <ClientDashboard />
                </PrivateRoute>
              } />
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } />
              <Route path="/customers/:id" element={
                <PrivateRoute>
                  <CustomerDetail />
                </PrivateRoute>
              } />
              <Route path="/reports" element={
                <PrivateRoute>
                  <ErrorBoundary>
                    <ReportingEngine />
                  </ErrorBoundary>
                </PrivateRoute>
              } />
              <Route path="/ai-insights" element={
                <AdminRoute>
                  <ErrorBoundary>
                    <AIInsights />
                  </ErrorBoundary>
                </AdminRoute>
              } />
            </Routes>
          </Box>
        </Router>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
