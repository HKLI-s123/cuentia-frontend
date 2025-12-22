"use client";

import { useEffect } from "react";

export default function RecaptchaLoader() {
  useEffect(() => {
    // Ya está cargado
    if (document.getElementById("recaptcha-script")) return;

    const script = document.createElement("script");
    script.id = "recaptcha-script";
    script.src = `https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_KEY}`;
    script.async = true;
    script.defer = true;

    document.body.appendChild(script);
  }, []);

  return null; // No renderiza nada
}
