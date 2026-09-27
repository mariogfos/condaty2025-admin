"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import HomePage from "@/components/Index/Index";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import { getFirstAccessibleMenuRoute } from "@/components/MainMenu/mainMenuConfig";
import Splash from "@/components/req/Splash";
import { useAuth } from "@/mk/contexts/AuthProvider";

/**
 * Inicio. Un admin sin `home:R` va a la primera pantalla del menú que puede
 * ver; sólo si no puede ver ninguna, «sin acceso».
 */
export default function Home() {
  const { userCan } = useAuth();
  const router = useRouter();
  const canViewHome = userCan("home", "R");
  const fallbackRoute = canViewHome
    ? null
    : getFirstAccessibleMenuRoute((permission, action) =>
        userCan(permission, action),
      );

  useEffect(() => {
    if (fallbackRoute) router.replace(fallbackRoute);
  }, [fallbackRoute, router]);

  if (canViewHome) return <HomePage />;
  return fallbackRoute ? <Splash /> : <NotAccess />;
}
