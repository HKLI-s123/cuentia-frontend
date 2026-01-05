"use client";

import { useEffect } from "react";
import { useSession } from "@/hooks/useSession";
import { useRouter } from "next/navigation";

export function useGuestRedirect() {
  const router = useRouter();
  const { user, loading } = useSession();

  useEffect(() => {
    if (!loading && user) {
      window.location.href="/dashboard/overview";
    }
  }, [user, loading]);

  return { user, loading };
}
