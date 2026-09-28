import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo iniciar sesión');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Iniciar sesión</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3" data-testid="form-login">
        <input
          type="text"
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border rounded px-3 py-2"
          data-testid="login-username"
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border rounded px-3 py-2"
          data-testid="login-password"
          required
        />
        {error && (
          <p className="text-red-600 text-sm" data-testid="login-error">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={enviando}
          className="bg-emerald-600 text-white rounded py-2 hover:bg-emerald-700 disabled:opacity-50"
          data-testid="login-submit"
        >
          {enviando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <p className="text-sm text-gray-500 mt-4">
        Usuarios de prueba: <code>ana/ana123</code>, <code>luis/luis123</code>, <code>admin/admin123</code>
      </p>
    </div>
  );
}
