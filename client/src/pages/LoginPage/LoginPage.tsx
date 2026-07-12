import React from 'react';
import { useAuthForm } from '../../hooks/auth/useAuthForm';
import Toast from '../../components/Toast';
import InputField from '../../components/InputField';
import Button from '../../components/Button';
import Logo from '../../components/Logo';
import type { LoginPageProps } from './LoginPage.types';

const LoginPage: React.FC<LoginPageProps> = () => {
  const {
    username, setUsername,
    password, setPassword,
    isAdmin, setIsAdmin,
    isRegistering, setIsRegistering,
    error,
    showToast, setShowToast,
    handleSubmit
  } = useAuthForm();
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white">
      <div className="bg-[#111] p-8 rounded-xl shadow-2xl w-full max-w-md border border-[#222]">
        <Logo className="text-3xl mb-6 text-center" />
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            label="Username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <InputField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {/*TODO: remove when done */}
          {isRegistering && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isAdmin"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                className="w-4 h-4 bg-[#1a1a1a] border border-[#333] rounded focus:ring-blue-500"
              />
              <label htmlFor="isAdmin" className="text-sm font-medium">Register as Admin (Unlimited Journals)</label>
            </div>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" fullWidth>
            {isRegistering ? 'Sign Up' : 'Log In'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-400">
          {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-purple-600 hover:underline"
          >
            {isRegistering ? 'Log In' : 'Sign Up'}
          </button>
        </p>
      </div>
      <Toast
        isOpen={showToast}
        message={error}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
};

export default LoginPage;
