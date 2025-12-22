// src/hooks/useSession.ts
"use client";

import { useEffect, useState } from "react";
import { fetchMe } from '../app/services/authService'
import { SessionUser } from "../types/auth";

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const profile = await fetchMe();
      if (profile) {
        setUser(profile);
      }
      setLoading(false);
    }
    load();
  }, []);

  return { user, loading };
}

