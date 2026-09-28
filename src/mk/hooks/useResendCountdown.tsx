"use client";
import { useCallback, useEffect, useState } from "react";

/**
 * La espera antes de poder pedir otro código.
 *
 * Nació en el paso del PIN del login (`LoginView`) y se sacó acá para que la
 * use también el cambio de correo o contraseña del perfil (`Authentication`).
 *
 * 🔴 No es decorativa: cada pedido de código gasta del `throttle` del API
 * (`pin-session`: 10 cada 15 minutos y 20 por día por cuenta). Sin la espera,
 * un usuario apurado se queda sin cupo y recibe un 429.
 *
 * @param active Mientras es `true` corre la cuenta; al pasar a `true` arranca
 *   de nuevo desde `seconds`.
 */
export const useResendCountdown = (active: boolean, seconds = 59) => {
  const [secondsLeft, setSecondsLeft] = useState(seconds);

  useEffect(() => {
    if (active) setSecondsLeft(seconds);
  }, [active, seconds]);

  useEffect(() => {
    if (!active || secondsLeft <= 0) return;
    const tick = setTimeout(() => setSecondsLeft((left) => left - 1), 1000);
    return () => clearTimeout(tick);
  }, [active, secondsLeft]);

  const restart = useCallback(() => setSecondsLeft(seconds), [seconds]);

  return { secondsLeft, canResend: active && secondsLeft <= 0, restart };
};
