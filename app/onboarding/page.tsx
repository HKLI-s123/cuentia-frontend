"use client";

import { useEffect, useState } from "react";
import { getSessionInfo } from "@/app/services/authService";
import { Upload, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { uploadOwnFirma } from "@/app/services/onboardingService";
import { extractRFCfromCer, omitOnboarding } from "@/app/services/onboardingService"; // <-- tu servicio

export default function OnboardingPage() {
  const router = useRouter();

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [dragActive, setDragActive] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [rfcDetectado, setRfcDetectado] = useState("");
  const [rfcFinal, setRfcFinal] = useState("");

  const [archivos, setArchivos] = useState<{ cer: File | null; key: File | null }>({
    cer: null,
    key: null,
  });

  const [fielPass, setFielPass] = useState("");

  // ------------------------------
  // 1) Cargar sesión
  // ------------------------------
  useEffect(() => {
    const load = async () => {
      try {
        const data = await getSessionInfo();

        if (!data.verified) {
          router.push("/validar-cuenta");
          return;
        }

        setSession(data);
      } catch (err) {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // ------------------------------
  // 2) Validaciones de acceso
  // ------------------------------
  useEffect(() => {
    if (!session) return;

    // Invitado NO pasa onboarding
    if (session.tipoCuenta === "invitado") {
      router.replace("/dashboard/dashboard");
      return;
    }

    console.log(session);

    // Ya tiene onboarding → fuera
    if (session.propioRFC) {
      router.replace("/dashboard/dashboard");
      return;
    }
  }, [session]);

  // ------------------------------
  // Auxiliar para nombres cortos
  // ------------------------------
  const truncateName = (fileName: string) => {
    if (fileName.length <= 14) return fileName;
    return fileName.slice(0, 14) + "…";
  };

  // ------------------------------
  // Subir archivos
  // ------------------------------
  const handleSubmit = async () => {
    if (!archivos.cer || !archivos.key) return toast.error("Debes subir tu archivo .cer y .key");
    if (!rfcFinal.trim()) return toast.error("Debes ingresar tu RFC");
    if (!fielPass.trim()) return toast.error("Debes ingresar la contraseña de la llave");

    try {
      await uploadOwnFirma(archivos.cer, archivos.key, fielPass, rfcFinal);

      toast.success("Archivos subidos correctamente");
      router.push("/dashboard/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Error al subir la información");
    }
  };

  if (loading || !session) {
    return (
      <div className="flex items-center justify-center h-[70vh] text-gray-500">
        Cargando...
      </div>
    );
  }

  const isEmpresarial = session?.tipoCuenta === "empresarial";

  const textoIntro =
    session?.tipoCuenta === "individual"
      ? "Sube tus archivos para permitir que CuentIA procese tus CFDIs."
      : "Opcional: si deseas que CuentIA procese también los CFDIs de tu empresa, sube tus archivos aquí.";

  return (
    <div className="max-w-2xl mx-auto mt-10 p-8 bg-white shadow-xl rounded-2xl border mb-4">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
        Configura tu Firma Electrónica (FIEL)
      </h1>

      <p className="text-center text-gray-600 mb-8">{textoIntro}</p>

      {/* DRAG & DROP */}
      <div className="mb-8">
        <label className="font-semibold text-gray-700">Archivos .cer y .key</label>

        {archivos.cer && archivos.key ? (
          <div className="mt-4 space-y-3">
            <div className="flex justify-between items-center border rounded p-3">
              <span className="text-gray-700">{truncateName(archivos.cer.name)}</span>
              <button className="text-gray-500 hover:text-red-600" onClick={() => setArchivos((p) => ({ ...p, cer: null }))}>
                🗑️
              </button>
            </div>

            <div className="flex justify-between items-center border rounded p-3">
              <span className="text-gray-700">{truncateName(archivos.key.name)}</span>
              <button className="text-gray-500 hover:text-red-600" onClick={() => setArchivos((p) => ({ ...p, key: null }))}>
                🗑️
              </button>
            </div>
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={async (e) => {
              e.preventDefault();
              setDragActive(false);

              const files = Array.from(e.dataTransfer.files || []);

              let cer = archivos.cer;
              let key = archivos.key;

              for (const f of files) {
                if (f.name.endsWith(".cer")) {
                  cer = f;

                  // EXTRAER RFC
                  const rfc = await extractRFCfromCer(f);
                  if (rfc) {
                    setRfcDetectado(rfc);
                    setRfcFinal(rfc);
                  } else {
                    toast.error("No se pudo extraer el RFC del certificado");
                  }
                }

                if (f.name.endsWith(".key")) {
                  key = f;
                }
              }

              setArchivos({ cer, key });
            }}
            className={`mt-3 w-full p-10 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition ${
              dragActive ? "border-indigo-600 bg-indigo-100" : "border-indigo-300 bg-indigo-50 hover:bg-indigo-100"
            }`}
          >
            <Upload className="text-indigo-600 mb-3" size={40} />

            <p className="text-gray-700 text-lg font-medium">Arrastra tus archivos aquí</p>

            <p className="my-2 text-gray-500">ó</p>

            <label className="text-indigo-600 font-semibold cursor-pointer hover:underline">
              Seleccionar desde tu dispositivo
              <input
                type="file"
                accept=".cer,.key"
                multiple
                className="hidden"
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []);

                  let cer = archivos.cer;
                  let key = archivos.key;

                  for (const f of files) {
                    if (f.name.endsWith(".cer")) {
                      cer = f;

                      const rfc = await extractRFCfromCer(f);
                      if (rfc) {
                        setRfcDetectado(rfc);
                        setRfcFinal(rfc);
                      } else {
                        toast.error("No se pudo extraer el RFC del certificado");
                      }
                    }

                    if (f.name.endsWith(".key")) key = f;
                  }

                  setArchivos({ cer, key });
                }}
              />
            </label>
          </div>
        )}
      </div>

      {/* RFC DETECTADO / EDITABLE */}
      {rfcDetectado && (
        <div className="mb-8">
          <label className="font-semibold text-gray-700">RFC detectado</label>
          <input
            type="text"
            className="w-full border border-gray-300 p-3 rounded-lg mt-2"
            value={rfcFinal}
            onChange={(e) => setRfcFinal(e.target.value.toUpperCase())}
          />
          <p className="text-gray-500 text-sm mt-1">
            Si el RFC es incorrecto, puedes corregirlo manualmente.
          </p>
        </div>
      )}

      {/* PASSWORD */}
      <div className="mb-8">
        <label className="font-semibold text-gray-700">Contraseña de la llave</label>

        <div className="relative mt-2">
          <input
            type={showPassword ? "text" : "password"}
            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Contraseña de la llave"
            value={fielPass}
            onChange={(e) => setFielPass(e.target.value)}
          />

          <div className="absolute right-3 top-3 cursor-pointer text-gray-600" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff /> : <Eye />}
          </div>
        </div>
      </div>

      {/* BOTONES */}
      <div className="space-y-4 mt-6">
        <button
          onClick={handleSubmit}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
        >
          Guardar y continuar
        </button>

        {isEmpresarial && (
           <button
             onClick={async () => {
               try {
                 await omitOnboarding();
                 toast.success("Onboarding omitido");
                 router.push("/dashboard/dashboard");
               } catch (err: any) {
                 console.error(err);
                 toast.error(err.message || "No se pudo omitir");
               }
             }}
             className="w-full text-gray-600 hover:text-gray-800 underline text-sm"
           >
             Omitir por ahora
           </button>
        )}
      </div>
    </div>
  );
}
