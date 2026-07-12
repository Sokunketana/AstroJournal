import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';

export const useAuthForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowToast(false);
    try {
      const payload: { username: string; password: string; role?: string } = { 
        username, 
        password 
      };
      if (isRegistering && isAdmin) {
        payload.role = 'admin';
      }
      
      const data = isRegistering 
        ? await authService.register(payload)
        : await authService.login(payload);
        
      login(data.token, data.user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setShowToast(true);
    }
  };

  return {
    username, setUsername,
    password, setPassword,
    isAdmin, setIsAdmin,
    isRegistering, setIsRegistering,
    error, setError,
    showToast, setShowToast,
    handleSubmit
  };
};
