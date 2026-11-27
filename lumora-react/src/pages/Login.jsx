import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import api from '../api';
import toast from 'react-hot-toast';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await api.post('/auth/register', formData);
        toast.success('Account created! Logging you in...');
        await login(formData.email, formData.password);
      }
    } catch (error) {
      if (!isLogin && !error.config?.url?.endsWith('/auth/login')) {
        toast.error(error.response?.data?.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-900 transition-colors duration-300">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight">{isLogin ? 'Welcome back' : 'Create an account'}</h2>
          <p className="mt-2 text-sm text-slate-500">{isLogin ? 'Enter your credentials to access your account.' : 'Start managing your finances today.'}</p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {!isLogin && (
            <Input label="Full Name" icon={User} type="text" required placeholder="Ada Lovelace" onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          )}
          <Input label="Email Address" icon={Mail} type="email" required placeholder="ada@company.com" onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          
          <div className="relative">
            <Input label="Password" icon={Lock} type={showPassword ? 'text' : 'password'} required placeholder="••••••••" onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
            <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <Button type="submit" className="w-full py-3" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className="font-semibold text-primary hover:underline">
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
}