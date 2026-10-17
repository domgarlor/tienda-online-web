import { useState } from 'react';

// Botón flotante que abre el chat de soporte dentro de un <iframe> (otra página
// HTML del mismo origen). Sirve para practicar frameLocator() / switchTo().frame().
export function ChatSoporte() {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="fixed bottom-4 left-4 flex flex-col items-start gap-2">
      {abierto && (
        <iframe
          title="Chat de soporte"
          src="/chat-soporte.html"
          className="w-80 h-96 border rounded-lg shadow-lg bg-white"
        />
      )}
      <button
        type="button"
        aria-expanded={abierto}
        onClick={() => setAbierto((a) => !a)}
        className="bg-emerald-600 text-white rounded-full px-4 py-2 shadow"
      >
        {abierto ? 'Cerrar soporte' : 'Soporte'}
      </button>
    </div>
  );
}
