import { useMemo, useState, type FormEvent } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';

interface Props {
  publishableKey: string;
  clientSecret: string;
  total: number;
  onPagado: (paymentIntentId: string) => Promise<void>;
}

// Stripe Elements monta el formulario de tarjeta dentro de un <iframe> de
// js.stripe.com (otro origen): hay que usar frameLocator() / switchTo().frame().
// Solo claves de TEST (pk_test_...): con la tarjeta 4242 4242 4242 4242 no se cobra nada real.
export function PagoTarjeta({ publishableKey, clientSecret, total, onPagado }: Props) {
  const stripePromise = useMemo(() => loadStripe(publishableKey), [publishableKey]);

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, locale: 'es' }}>
      <Formulario total={total} onPagado={onPagado} />
    </Elements>
  );
}

function Formulario({ total, onPagado }: { total: number; onPagado: Props['onPagado'] }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setError(null);
    setProcesando(true);

    // redirect: 'if_required' mantiene al usuario en la página con tarjetas (incluido el reto 3DS).
    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/carrito` },
      redirect: 'if_required',
    });

    if (stripeError) {
      setError(stripeError.message ?? 'No se pudo procesar el pago');
      setProcesando(false);
      return;
    }
    if (paymentIntent?.status !== 'succeeded') {
      setError(`El pago no se completó (estado: ${paymentIntent?.status})`);
      setProcesando(false);
      return;
    }

    try {
      await onPagado(paymentIntent.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'El pago se cobró pero no se pudo crear el pedido');
      setProcesando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3" data-testid="form-pago">
      <PaymentElement />
      {error && (
        <p role="alert" className="text-red-600 text-sm" data-testid="pago-error">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={!stripe || procesando}
        className="bg-emerald-600 text-white rounded py-2 px-4 hover:bg-emerald-700 disabled:opacity-50"
        data-testid="pagar"
      >
        {procesando ? 'Procesando pago...' : `Pagar ${total.toFixed(2)} €`}
      </button>
    </form>
  );
}
