import { useState, type ChangeEvent } from 'react';
import { useAuth } from '../context/AuthContext';

const TIPOS_VALIDOS = ['image/png', 'image/jpeg'];
const TAMANO_MAXIMO = 1024 * 1024; // 1 MB

// Subida de archivos: <input type="file"> con validación de tipo y tamaño y
// vista previa. La imagen se guarda en localStorage (por usuario), no en el backend.
export function Perfil() {
  const { sesion } = useAuth();
  const clave = `tienda-avatar-${sesion?.username}`;
  const [avatar, setAvatar] = useState<string | null>(() => localStorage.getItem(clave));
  const [error, setError] = useState<string | null>(null);

  function alElegir(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    if (!TIPOS_VALIDOS.includes(archivo.type)) {
      setError('Formato no válido: usa una imagen PNG o JPG.');
      return;
    }
    if (archivo.size > TAMANO_MAXIMO) {
      setError('La imagen supera el tamaño máximo de 1 MB.');
      return;
    }

    setError(null);
    const lector = new FileReader();
    lector.onload = () => {
      const url = lector.result as string;
      localStorage.setItem(clave, url);
      setAvatar(url);
    };
    lector.readAsDataURL(archivo);
  }

  function quitar() {
    localStorage.removeItem(clave);
    setAvatar(null);
  }

  return (
    <div className="p-6 max-w-md">
      <h1 className="text-2xl font-semibold mb-4">Mi perfil</h1>
      <p className="mb-4">
        Usuario: <strong data-testid="perfil-username">{sesion?.username}</strong>
      </p>

      {avatar ? (
        <img src={avatar} alt={`Avatar de ${sesion?.username}`} className="w-32 h-32 rounded-full object-cover mb-2" />
      ) : (
        <p className="mb-2 text-gray-500" data-testid="sin-avatar">Aún no has subido una foto.</p>
      )}

      <label htmlFor="avatar" className="block text-sm text-gray-600">Foto de perfil (PNG o JPG, máx. 1 MB)</label>
      <input id="avatar" type="file" accept="image/png,image/jpeg" onChange={alElegir} />

      {error && <p role="alert" className="text-red-600 mt-2">{error}</p>}

      {avatar && (
        <button type="button" onClick={quitar} className="mt-3 border rounded px-3 py-1.5">
          Quitar foto
        </button>
      )}
    </div>
  );
}
