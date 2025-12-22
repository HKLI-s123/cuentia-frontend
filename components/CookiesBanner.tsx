"use client";
import { useEffect, useState } from "react";

export default function CookiesBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) setShow(true);
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookieConsent", "granted");
    setShow(false);

    // Aquí puedes activar analytics en el futuro
    // initAnalytics();
  };

  const rejectCookies = () => {
    localStorage.setItem("cookieConsent", "denied");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="cookies-banner shadow-lg">
      <div className="cookies-text">
        Usamos cookies para mejorar tu experiencia. Puedes aceptar o rechazar su uso.
      </div>
      <div className="cookies-actions">
      <button onClick={rejectCookies} className="btn btn-light reject-btn">
        Rechazar
      </button>
    
      <button onClick={acceptCookies} className="btn btn-primary accept-btn">
        Aceptar
      </button>
    </div>

      {/* Estilos */}
      <style jsx>{`
        .cookies-banner {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 95%;
          max-width: 600px;
          background: white;
          border-radius: 12px;
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 9999;
          border: 1px solid #e5e7eb;
        }

        .cookies-text {
          font-size: 0.95rem;
          color: #374151;
          max-width: 70%;
        }

        .cookies-actions {
           display: flex;
           align-items: center; /* ⭐ centrado perfecto */
           gap: 12px; /* ⭐ separación ideal entre botones */
        }

        .reject-btn {
          padding: 8px 16px;
          background: #f3f4f6 !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 8px;
        }
      
        .reject-btn:hover {
          background: #e5e7eb !important;
          color: black !important;
        }
      
        .accept-btn {
          padding: 8px 20px;
          background-color: #4f46e5 !important;
          border-color: #4f46e5 !important;
          border-radius: 8px;
        }
      
        .accept-btn:hover {
          background-color: #4338ca !important;
          border-color: #4338ca !important;
        }
    
      `}</style>
    </div>
  );
}
