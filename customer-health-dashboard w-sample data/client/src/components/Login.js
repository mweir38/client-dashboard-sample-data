import React, { useState } from 'react';
import {
  Box,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Paper,
  Fade
} from '@mui/material';
import { Security } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { email, password } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('🔍 Debug: Attempting login...');
    console.log('🔍 Debug: Email:', email);
    console.log('🔍 Debug: Password length:', password.length);

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const body = JSON.stringify({ email, password });
      console.log('🔍 Debug: Request body:', { email, password: '***' });
      
      const res = await axios.post('http://localhost:5000/api/auth/login', body, config);
      
      console.log('🔍 Debug: Login successful!');
      console.log('🔍 Debug: Response data:', res.data);

      // Store token and user info in localStorage
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      console.log('🔍 Debug: Token stored in localStorage');
      console.log('🔍 Debug: User role:', res.data.user.role);
      
      // Redirect based on user role
      if (res.data.user.role === 'admin') {
        console.log('🔍 Debug: Redirecting to /admin');
        navigate('/admin');
      } else if (res.data.user.role === 'client') {
        console.log('🔍 Debug: Redirecting to /client-dashboard');
        navigate('/client-dashboard');
      } else {
        console.log('🔍 Debug: Redirecting to /dashboard');
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('🔍 Debug: Login error:', err);
      console.error('🔍 Debug: Error response:', err.response?.data);
      console.error('🔍 Debug: Error status:', err.response?.status);
      setError(err.response?.data?.msg || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a1929 0%, #1e3a8a 50%, #0f172a 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 193, 7, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(76, 175, 80, 0.05) 0%, transparent 50%)
          `,
          pointerEvents: 'none'
        }
      }}
    >
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Fade in timeout={800}>
          <Paper
            elevation={24}
            sx={{
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: 4,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            {/* Header with VMO Solutions branding */}
            <Box
              sx={{
                background: 'linear-gradient(135deg, #0a1929 0%, #1e3a8a 100%)',
                color: 'white',
                p: 4,
                textAlign: 'center',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: 'linear-gradient(90deg, transparent, #7dd3d8, transparent)'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <Box
                  component="img"
                  src="/vmo-logo.svg"
                  alt="VMO Solutions"
                  sx={{
                    height: 60,
                    width: 'auto',
                    filter: 'brightness(1.1)'
                  }}
                />
              </Box>
              <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300, color: '#7dd3d8' }}>
                Customer Health Dashboard
              </Typography>
      
            </Box>

            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                <Security sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" color="primary.main" fontWeight="600">
                  Secure Access
                </Typography>
              </Box>
              
              {error && (
                <Alert
                  severity="error"
                  sx={{
                    mb: 3,
                    borderRadius: 2,
                    '& .MuiAlert-icon': {
                      color: '#d32f2f'
                    }
                  }}
                >
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={onSubmit}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={onChange}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }
                    }
                  }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={onChange}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }
                    }
                  }}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    background: 'linear-gradient(135deg, #0a1929 0%, #1e3a8a 100%)',
                    boxShadow: '0 4px 16px rgba(125, 211, 216, 0.3)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1e3a8a 0%, #0a1929 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 24px rgba(125, 211, 216, 0.4)'
                    },
                    '&:disabled': {
                      background: 'rgba(0,0,0,0.12)',
                      color: 'rgba(0,0,0,0.26)'
                    }
                  }}
                >
                  {loading ? 'Authenticating...' : 'Sign In'}
                </Button>
              </Box>
              
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  background: 'rgba(125, 211, 216, 0.05)',
                  borderRadius: 2,
                  border: '1px solid rgba(125, 211, 216, 0.2)'
                }}
              >
                <Typography variant="body2" color="text.secondary" align="center" fontWeight="500">
                  Demo Credentials
                </Typography>
                <Typography variant="body2" sx={{ color: '#7dd3d8', mt: 0.5 }} align="center">
                  admin@example.com / password123 -
                  user@example.com / password123 -
                  client@acme.com / password123
                </Typography>
              </Box>
            </CardContent>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default Login;
