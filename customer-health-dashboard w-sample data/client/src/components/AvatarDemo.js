import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Card,
  CardContent,
  CardHeader
} from '@mui/material';
import UserAvatar from './UserAvatar';

const AvatarDemo = () => {
  const [showDemo, setShowDemo] = useState(false);

  const demoUsers = [
    {
      name: "John Smith",
      email: "admin@example.com",
      role: "admin"
    },
    {
      name: "Sarah Johnson",
      email: "client@acme.com",
      role: "client"
    },
    {
      name: "Mike Wilson",
      email: "user@company.com",
      role: "user"
    }
  ];

  const impersonationData = {
    targetCustomer: {
      name: "Acme Corporation"
    },
    targetUser: {
      name: "Client User",
      role: "client"
    }
  };

  if (!showDemo) {
    return (
      <Button 
        variant="outlined" 
        onClick={() => setShowDemo(true)}
        sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}
      >
        Show Avatar Demo
      </Button>
    );
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'rgba(0,0,0,0.8)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2
      }}
      onClick={() => setShowDemo(false)}
    >
      <Card 
        sx={{ maxWidth: 800, width: '100%', maxHeight: '90vh', overflow: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader
          title="Enhanced User Avatar Showcase"
          subheader="Click outside to close"
          action={
            <Button onClick={() => setShowDemo(false)}>Close</Button>
          }
        />
        <CardContent>
          <Grid container spacing={4}>
            {/* Different User Types */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                User Roles
              </Typography>
              <Box display="flex" gap={3} alignItems="center" flexWrap="wrap">
                {demoUsers.map((user, index) => (
                  <Box key={index} textAlign="center">
                    <UserAvatar
                      user={user}
                      size={60}
                      showBadge={true}
                      showStatus={true}
                    />
                    <Typography variant="caption" display="block" mt={1}>
                      {user.role}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Grid>

            {/* Different Sizes */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Different Sizes
              </Typography>
              <Box display="flex" gap={3} alignItems="center" flexWrap="wrap">
                {[24, 32, 40, 48, 64, 80].map((size) => (
                  <Box key={size} textAlign="center">
                    <UserAvatar
                      user={demoUsers[0]}
                      size={size}
                      showBadge={true}
                      showStatus={true}
                    />
                    <Typography variant="caption" display="block" mt={1}>
                      {size}px
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Grid>

            {/* Impersonation States */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Impersonation States
              </Typography>
              <Box display="flex" gap={3} alignItems="center" flexWrap="wrap">
                <Box textAlign="center">
                  <UserAvatar
                    user={demoUsers[0]}
                    size={60}
                    showBadge={true}
                    showStatus={true}
                    isImpersonating={true}
                    impersonationData={{ targetCustomer: impersonationData.targetCustomer }}
                  />
                  <Typography variant="caption" display="block" mt={1}>
                    Customer Impersonation
                  </Typography>
                </Box>
                <Box textAlign="center">
                  <UserAvatar
                    user={demoUsers[0]}
                    size={60}
                    showBadge={true}
                    showStatus={true}
                    isImpersonating={true}
                    impersonationData={{ targetUser: impersonationData.targetUser }}
                  />
                  <Typography variant="caption" display="block" mt={1}>
                    User Impersonation
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Badge and Status Variations */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Badge and Status Options
              </Typography>
              <Box display="flex" gap={3} alignItems="center" flexWrap="wrap">
                <Box textAlign="center">
                  <UserAvatar
                    user={demoUsers[0]}
                    size={60}
                    showBadge={true}
                    showStatus={true}
                  />
                  <Typography variant="caption" display="block" mt={1}>
                    Badge + Status
                  </Typography>
                </Box>
                <Box textAlign="center">
                  <UserAvatar
                    user={demoUsers[0]}
                    size={60}
                    showBadge={true}
                    showStatus={false}
                  />
                  <Typography variant="caption" display="block" mt={1}>
                    Badge Only
                  </Typography>
                </Box>
                <Box textAlign="center">
                  <UserAvatar
                    user={demoUsers[0]}
                    size={60}
                    showBadge={false}
                    showStatus={true}
                  />
                  <Typography variant="caption" display="block" mt={1}>
                    Status Only
                  </Typography>
                </Box>
                <Box textAlign="center">
                  <UserAvatar
                    user={demoUsers[0]}
                    size={60}
                    showBadge={false}
                    showStatus={false}
                  />
                  <Typography variant="caption" display="block" mt={1}>
                    Clean
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AvatarDemo;