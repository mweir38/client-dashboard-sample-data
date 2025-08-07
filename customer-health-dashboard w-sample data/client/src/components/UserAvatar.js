import React, { useEffect } from 'react';
import {
  Avatar,
  Badge,
  Box,
  useTheme,
  alpha
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  Business as ClientIcon,
  Person as UserIcon,
  Security as ImpersonationIcon
} from '@mui/icons-material';

const UserAvatar = ({ 
  user, 
  size = 40, 
  showBadge = true, 
  showStatus = true,
  isImpersonating = false,
  impersonationData = null,
  onClick,
  sx = {} 
}) => {
  const theme = useTheme();

  // Inject CSS animations
  useEffect(() => {
    const styleId = 'user-avatar-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const getUserInitials = () => {
    if (isImpersonating && impersonationData) {
      if (impersonationData.targetCustomer) {
        return impersonationData.targetCustomer.name?.charAt(0)?.toUpperCase() || 'C';
      } else if (impersonationData.targetUser) {
        return impersonationData.targetUser.name?.charAt(0)?.toUpperCase() || 'U';
      }
    }
    
    if (user?.name) {
      const names = user.name.split(' ');
      if (names.length >= 2) {
        return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
      }
      return user.name.charAt(0).toUpperCase();
    }
    
    return user?.email?.charAt(0)?.toUpperCase() || 'U';
  };

  const getAvatarColor = () => {
    if (isImpersonating) {
      return {
        background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
        border: `2px solid ${theme.palette.warning.light}`,
        boxShadow: `0 0 0 2px ${alpha(theme.palette.warning.main, 0.2)}`
      };
    }
    
    switch (user?.role) {
      case 'admin':
        return {
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          border: `2px solid ${theme.palette.primary.light}`,
          boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`
        };
      case 'client':
        return {
          background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
          border: `2px solid ${theme.palette.secondary.light}`,
          boxShadow: `0 0 0 2px ${alpha(theme.palette.secondary.main, 0.2)}`
        };
      default:
        return {
          background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
          border: `2px solid ${theme.palette.info.light}`,
          boxShadow: `0 0 0 2px ${alpha(theme.palette.info.main, 0.2)}`
        };
    }
  };

  const getRoleIcon = () => {
    if (isImpersonating) return <ImpersonationIcon sx={{ fontSize: size * 0.4 }} />;
    
    switch (user?.role) {
      case 'admin':
        return <AdminIcon sx={{ fontSize: size * 0.4 }} />;
      case 'client':
        return <ClientIcon sx={{ fontSize: size * 0.4 }} />;
      default:
        return <UserIcon sx={{ fontSize: size * 0.4 }} />;
    }
  };

  const getBadgeContent = () => {
    if (isImpersonating) return 'I';
    
    switch (user?.role) {
      case 'admin':
        return 'A';
      case 'client':
        return 'C';
      default:
        return 'U';
    }
  };

  const getBadgeColor = () => {
    if (isImpersonating) return 'warning';
    
    switch (user?.role) {
      case 'admin':
        return 'primary';
      case 'client':
        return 'secondary';
      default:
        return 'info';
    }
  };



  const avatarStyles = {
    width: size,
    height: size,
    fontSize: size * 0.4,
    fontWeight: 600,
    cursor: onClick ? 'pointer' : 'default',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'visible',
    ...getAvatarColor(),
    '&:hover': onClick ? {
      transform: 'scale(1.08) translateY(-1px)',
      boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.4)}`,
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.1)',
      }
    } : {},
    '&::before': isImpersonating ? {
      content: '""',
      position: 'absolute',
      top: -2,
      left: -2,
      right: -2,
      bottom: -2,
      borderRadius: '50%',
      background: `conic-gradient(from 0deg, ${theme.palette.warning.main}, ${theme.palette.warning.light}, ${theme.palette.warning.main})`,
      animation: 'rotate 2s linear infinite',
      zIndex: -1,
    } : {},
    ...sx
  };

  const AvatarComponent = (
    <Avatar sx={avatarStyles} onClick={onClick}>
      {getUserInitials()}
    </Avatar>
  );

  const BadgedAvatar = showBadge ? (
    <Badge
      badgeContent={getBadgeContent()}
      color={getBadgeColor()}
      sx={{
        '& .MuiBadge-badge': {
          fontSize: '0.7rem',
          height: 20,
          minWidth: 20,
          fontWeight: 600,
          border: `2px solid ${theme.palette.background.paper}`,
          boxShadow: theme.shadows[2]
        }
      }}
    >
      {AvatarComponent}
    </Badge>
  ) : AvatarComponent;

  const StatusIndicator = showStatus && (
    <Box
      sx={{
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: size * 0.25,
        height: size * 0.25,
        borderRadius: '50%',
        bgcolor: isImpersonating ? 'warning.main' : 'success.main',
        border: `2px solid ${theme.palette.background.paper}`,
        boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.3)}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease-in-out',
        animation: isImpersonating ? 'pulse 2s ease-in-out infinite' : 'none',
        '&:hover': {
          transform: 'scale(1.1)',
        }
      }}
    >
      {getRoleIcon()}
    </Box>
  );

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      {BadgedAvatar}
      {StatusIndicator}
    </Box>
  );
};

export default UserAvatar;