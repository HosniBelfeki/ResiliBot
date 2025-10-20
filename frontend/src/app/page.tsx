"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { ROUTES } from "@/constants";

export default function HomePage() {
  const router = useRouter();
  const { setUser, setAuthenticated } = useAppStore();

  useEffect(() => {
    // Auto-login without authentication - set a default user
    const defaultUser = {
      id: "1",
      name: "ResiliBot User",
      email: "user@resilibot.com",
      role: "Admin",
      avatar: null,
    };

    setUser(defaultUser);
    setAuthenticated(true);
    router.push(ROUTES.DASHBOARD);
  }, [router, setUser, setAuthenticated]);

  return null;
}
