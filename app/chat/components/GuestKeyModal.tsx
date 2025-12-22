"use client";

import React, { useEffect, useState } from "react";
import { GuestKeyCreator } from "./GuestKeyCreator";

type Props = {
  open: boolean;
  onClose: () => void;
  availableRfcs: { rfc: string; nombre: string }[]
  authToken?: string | null;
};

export const GuestKeyModal: React.FC<Props> = ({
  open,
  onClose,
  availableRfcs,
  authToken,
}) => {
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);        // monta el modal

      // activa animación en el siguiente frame
      requestAnimationFrame(() => {
        setAnimate(true);
      });

    } else {
      setAnimate(false);      // inicia fade/scale de salida

      // espera la animación antes de desmontar
      setTimeout(() => setVisible(false), 200);
    }
  }, [open]);

  if (!visible) return null;

  return (
    <div
      className={`
        fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center
        transition-opacity duration-200
        ${animate ? "opacity-100" : "opacity-0"}
      `}
    >
      <div
        className={`
          relative bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto
          transition-all duration-200
          ${animate ? "scale-100 opacity-100" : "scale-95 opacity-0"}
        `}
      >
        <button
          onClick={onClose}
          className="absolute top-1 right-2 text-gray-400 hover:text-gray-200 text-xl"
        >
          ✕
        </button>

        <GuestKeyCreator availableRfcs={availableRfcs} authToken={authToken} />
      </div>
    </div>
  );
};
