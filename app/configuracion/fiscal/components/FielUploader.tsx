import { useState } from "react";
import { Upload, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { extractRFCfromCer } from "@/app/services/onboardingService";
import { uploadOwnFirma } from "@/app/services/onboardingService";
import { updateCertificates } from "@/app/services/onboardingService"; // <-- CORRECTO

export default function FielUploaderFiscal({
  rfcInicial,
  onClose,
  title,
  description,
}: any) {
  const [dragActive, setDragActive] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [rfcDetectado, setRfcDetectado] = useState(rfcInicial || "");
  const [rfcFinal, setRfcFinal] = useState(rfcInicial || "");

  const [archivos, setArchivos] = useState<{ cer: File | null; key: File | null }>({
    cer: null,
    key: null,
  });

  const [fielPass, setFielPass] = useState("");

  const truncateName = (fileName: string) => {
    if (fileName.length <= 14) return fileName;
    return fileName.slice(0, 14) + "…";
  };

  const handleSubmit = async () => {
    if (!archivos.cer || !archivos.key) return toast.error("Debes subir .cer y .key");
    if (!rfcFinal.trim()) return toast.error("Debes ingresar el RFC");
    if (!fielPass.trim()) return toast.error("Debes ingresar la contraseña");

    try {
      // --------------------------------
      // 🚀 Si NO tiene propioRFC → subir por PRIMERA VEZ
      // --------------------------------
      console.log("rfc inicial",rfcFinal);
      if (!rfcFinal) {
        await uploadOwnFirma(archivos.cer, archivos.key, fielPass, rfcFinal);
        toast.success("Certificados agregados correctamente");
        onClose();
        return;
      }

      // --------------------------------
      // 🔄 Si ya tiene propioRFC → actualizar
      // --------------------------------
      await updateCertificates(archivos.cer, archivos.key, fielPass, rfcFinal);

      toast.success("Certificados actualizados con éxito");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Error al procesar certificados");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white max-w-2xl w-full p-8 rounded-2xl shadow-xl border relative">
        {/* CLOSE */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
        >
          ✕
        </button>

        <h1 className="text-2xl font-bold text-gray-800 mb-4">{title}</h1>
        <p className="text-gray-600 mb-8">{description}</p>

        {/* DRAG & DROP */}
        <div className="mb-8">
          <label className="font-semibold text-gray-700">Archivos .cer y .key</label>

          {archivos.cer && archivos.key ? (
            <div className="mt-4 space-y-3">
              {/* CER */}
              <div className="flex justify-between items-center border rounded p-3">
                <span className="text-gray-700">{truncateName(archivos.cer.name)}</span>
                <button
                  className="text-gray-500 hover:text-red-600"
                  onClick={() => setArchivos((p) => ({ ...p, cer: null }))}
                >
                  🗑️
                </button>
              </div>

              {/* KEY */}
              <div className="flex justify-between items-center border rounded p-3">
                <span className="text-gray-700">{truncateName(archivos.key.name)}</span>
                <button
                  className="text-gray-500 hover:text-red-600"
                  onClick={() => setArchivos((p) => ({ ...p, key: null }))}
                >
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
                    const rfc = await extractRFCfromCer(f);
                    if (rfc) {
                      setRfcDetectado(rfc);
                      setRfcFinal(rfc);
                    } else toast.error("No se pudo extraer el RFC del .cer");
                  }

                  if (f.name.endsWith(".key")) key = f;
                }

                setArchivos({ cer, key });
              }}
              className={`mt-3 w-full p-10 rounded-xl border-2 border-dashed text-center cursor-pointer transition ${
                dragActive
                  ? "border-indigo-600 bg-indigo-100"
                  : "border-indigo-300 bg-indigo-50 hover:bg-indigo-100"
              }`}
            >
              <Upload className="text-indigo-600 mb-3 mx-auto" size={40} />
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
                        } else toast.error("No se pudo extraer el RFC del .cer");
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

        {/* RFC */}
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
              Puedes corregirlo si es necesario.
            </p>
          </div>
        )}

        {/* PASSWORD */}
        <div className="mb-8">
          <label className="font-semibold text-gray-700">Contraseña de la llave</label>

          <div className="relative mt-2">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full border border-gray-300 p-3 rounded-lg"
              placeholder="Contraseña de la llave"
              value={fielPass}
              onChange={(e) => setFielPass(e.target.value)}
            />

            <div
              className="absolute right-3 top-3 cursor-pointer text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
            >
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
            Guardar cambios
          </button>

          <button
            onClick={onClose}
            className="w-full text-gray-600 hover:text-gray-800 underline text-sm"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
