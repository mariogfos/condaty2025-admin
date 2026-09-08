"use client";

import HomePage from "@/components/Index/Index";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import { getFirstAccessibleMenuRoute } from "@/components/MainMenu/mainMenuConfig";
import Splash from "@/components/req/Splash";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
// import EventList from "@/components/EventList/EventList";

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
    if (!canViewHome && fallbackRoute) {
      router.replace(fallbackRoute);
    }
  }, [canViewHome, fallbackRoute, router]);

  if (!canViewHome) {
    return fallbackRoute ? <Splash /> : <NotAccess />;
  }

  // return isMobile ? <EventList /> : <HomePage />;
  // return isMobile ? (
  //   <p>No hay eventos disponibles para este día</p>
  // ) : (
  //   <HomePage />
  // );
  return <HomePage />;
}
