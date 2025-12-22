"use client";

import { useState, useRef, useEffect } from "react";
import { Moon, Sun } from "lucide-react"; // 👈 Íconos de modo oscuro/luz
import { activateGuest, sendChatMessage } from "../../services/chatService";
import { AIResultRenderer } from "./AIResultRenderer";
import { GuestKeyModal } from "./GuestKeyModal";
import { validateGuestKey } from "../../services/chatService"; // o donde lo tengas
import { addWeeks, startOfWeek, endOfWeek, format } from "date-fns";
import { toast } from "sonner"
import { es } from "date-fns/locale";
import { apiFetch } from "@/app/services/apiClient";
import { getSessionInfo } from "@/app/services/authService";
import { useOnboardingRedirect } from "@/hooks/useUserSessionGuard";

type Message = {
  role: "user" | "bot";
  content: string;
  raw?: any,
};

type ChatProps = {
  onSendMessage: (message: string) => Promise<string>;
  tipoCuenta?: "individual" | "empresarial" | "invitado" | "empleado" ;
  rfcCliente?: string;
};

export const Chat = ({}:ChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false); // 🌙 estado del modo oscuro
  const [guestKey, setGuestKey] = useState("");

  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");
  const [cantidadCfdis, setCantidadCfdis] = useState<number | null>(null);
  const [periodoSeleccion, setPeriodoSeleccion] = useState<string>("");
  const [panelAbierto, setPanelAbierto] = useState(true);
  const [openGuestModal, setOpenGuestModal] = useState(false);
  const [clientes, setClientes] = useState<{ rfc: string; nombre: string }[]>([]);
  const [rfc, setRfc] = useState<string>("");
  const [tipoCuenta, setTipoCuenta] = useState<"individual" | "empresarial" | "invitado" | "empleado" |null>(null);


  const [semanas, setSemanas] = useState<{ id: string; label: string; cantidad: number }[]>([]);
  const [semanasSeleccionadas, setSemanasSeleccionadas] = useState<string[]>([]);
  const [totalSeleccionado, setTotalSeleccionado] = useState<number>(0);
  

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [invitePanelVisible, setInvitePanelVisible] = useState(true);
  const [session, setSession] = useState<any>(null);

 useEffect(() => {
    const load = async () => {
      try {
        const data = await getSessionInfo();
        setSession(data);
      } catch (err: any) {
        console.error("Error cargando sesión:", err);
  
        // Si el backend devuelve 401 → no hay sesión → login
        if (err?.status === 401 || err?.status === 403) {
          localStorage.removeItem("accessToken"); 
          window.location.href = "/login";
        }
  
        // fallback por si otro error raro ocurre
        window.location.href = "/login";
      }
    };
  
    load();
  }, []);
  // ------------------------------
  // 2) Redirección onboarding
  // ------------------------------
  useOnboardingRedirect(session);

  const isConsulta = session?.role === "consulta";

  // ------------------------------
  // 3) Cuando session llega → cargar datos UI
  // ------------------------------
  useEffect(() => {
    if (!session) return;

    setTipoCuenta(session.tipoCuenta);
    setClientes(session.clientes);

    if (session.tipoCuenta === "individual" && session.clientes.length > 0) {
      setRfc(session.clientes[0].rfc);
      setInvitePanelVisible(false);
    }

    if (session.tipoCuenta === "invitado") {
      if (session.guestRfc) {
        setRfc(session.guestRfc);
        setInvitePanelVisible(false);
      } else {
        setInvitePanelVisible(true);
      }
    }

    if (session.tipoCuenta === "empresarial" || session.tipoCuenta === "empleado") {
      if (session.propioRFC) {
        // ✔ Empresa con onboarding completo → usar su propio RFC como base
        setRfc(session.propioRFC);
      } else {
        // ❗ Empresa sin onboarding → dejarlo vacío y activar onboarding en redirect hook
        setRfc("");
      }
      setInvitePanelVisible(false);
    }
  }, [session]);

  console.log(tipoCuenta);

  // Detecta cuando se selecciona periodo
  useEffect(() => {
    if (periodoSeleccion) {
      setPanelAbierto(false); // colapsa automáticamente
    }
  }, [periodoSeleccion]);
  
  useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  const handleSend = async (customMessage?: string) => {
    const text = customMessage ?? input;
    if (!text.trim()) return;
  
    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
  
    // Construir array de semanas con fechas
  const semanasParaEnviar: { id: string; label: string; cantidad: number }[] = semanasSeleccionadas
    .map((id) => {
      const sem = semanas.find((s) => s.id === id);
      if (!sem) return null;
      return { id: sem.id, label: sem.label, cantidad: sem.cantidad };
    })
    .filter(
      (s): s is { id: string; label: string; cantidad: number } => !!s
    );

  
    const botResponse = await sendChatMessage({
      message: text,
      rfc: rfc,          // RFC seleccionado
      semanas: semanasParaEnviar,   // array con semanas seleccionadas
    });

    console.log("📊 datos crudos:", botResponse.raw);

    setMessages((prev) => [...prev, { role: "bot", content: botResponse.reply, raw: botResponse.raw}]);
    
    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  const obtenerCantidadFacturasSemana = async (rfc: string, fechaInicio: string, fechaFin: string) => {
    try {
      const response = await apiFetch(`http://localhost:3001/cfdis/cantidad-por-semana?rfc=${rfc}&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
      if (!response?.ok) throw new Error("Error al obtener las facturas");
      const data = await response.json();
      return data; // ← espera que sea algo como [{ semana: 1, cantidad: 120 }, ...]
    } catch (error) {
      console.error(error);
      return null;
    }
  };


  useEffect(() => {
    const cargarFacturasPorSemana = async () => {
      if (fechaInicio && fechaFin) {
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);
        if (inicio > fin) return;
  
        // Llamar al endpoint
        const data = await obtenerCantidadFacturasSemana(rfc, fechaInicio, fechaFin);
        if (!data) return;
  
        // Suponiendo que el backend devuelve [{ semana: 1, cantidad: 120 }, ...]
        const numSemanas = data.length;
  
        const nuevasSemanas = data.map((item: any, i: number) => {
          const iniSem = startOfWeek(addWeeks(inicio, i), { weekStartsOn: 1 });
          const finSem = endOfWeek(iniSem, { weekStartsOn: 1 });
          const label = `Semana ${i + 1}: ${format(iniSem, "d MMM", { locale: es })} - ${format(finSem, "d MMM", { locale: es })}`;
          return { id: `semana-${i + 1}`, label, cantidad: item.cantidad };
        });
  
        setSemanas(nuevasSemanas);
        setCantidadCfdis(
          nuevasSemanas.reduce((a: number, b: { cantidad: number }) => a + b.cantidad, 0)
        );
        setSemanasSeleccionadas([]);
        setTotalSeleccionado(0);
        setPeriodoSeleccion("");
      }
    };
  
    cargarFacturasPorSemana();
  }, [fechaInicio, fechaFin, rfc]);

  if (tipoCuenta === null) {
    return (
      <div className="flex items-center justify-center h-[85vh]">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

   if (tipoCuenta === "invitado" && invitePanelVisible) {
    return (
      <div
        className={`
          flex flex-col h-[85vh] min-h-[600px] max-h-[950px] border rounded-2xl shadow-lg overflow-hidden w-full
          ${darkMode ? "bg-gray-900 text-white" : "bg-white text-black"}
          transition-all duration-200"
        `}
      >
        <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
          <h2 className="text-xl font-bold">Acceso Invitado</h2>
          <p>Pega tu clave de invitado</p>
  
          <input
            value={guestKey}
            onChange={(e) => setGuestKey(e.target.value)}
            className="border p-2 rounded-md w-64"
            placeholder="ej: 8d21ccxa33fe"
          />
  
          <button
            onClick={async () => {
              const cleaned = guestKey.trim();
              if (!cleaned) {
                toast.warning("Ingresa una clave");
                return;
              }
  
              const result = await validateGuestKey(cleaned);
  
              if (!result) {
                toast.error("Clave inválida o bloqueada");
                return;
              }
  
             try {
                  await activateGuest(result.rfc);
                  toast.success("Acceso invitado activado correctamente");
                
                  // 🔄 Recargar sesión REAL desde backend
                  const refreshed = await getSessionInfo();
                
                  setRfc(refreshed.guestRfc || result.rfc);
                  setInvitePanelVisible(false);   // ✔ LO CORRECTO
                
                } catch (err) {
                  console.error(err);
                  toast.error("Error activando acceso invitado");
                }
            }}
            className="px-4 py-2 bg-black text-white rounded-md"
          >
            Validar clave
          </button>
        </div>
      </div>
    );
  }
  
  const toggleSemana = (semana: { id: string; cantidad: number }) => {
  const isSelected = semanasSeleccionadas.includes(semana.id);
  let nuevoTotal = totalSeleccionado;

  if (isSelected) {
    setSemanasSeleccionadas(semanasSeleccionadas.filter((s) => s !== semana.id));
    nuevoTotal -= semana.cantidad;
  } else {
    if (nuevoTotal + semana.cantidad > 1000) {
      toast.warning("Límite de 1000 CFDIs alcanzado. No puedes agregar más semanas.");
      return;
    }
    setSemanasSeleccionadas([...semanasSeleccionadas, semana.id]);
    nuevoTotal += semana.cantidad;
  }

  setTotalSeleccionado(nuevoTotal);
  };
  
  const confirmarSeleccion = () => {
    if (semanasSeleccionadas.length === 0) {
      toast.warning("Selecciona al menos una semana.");
      return;
    }
    setPeriodoSeleccion(semanasSeleccionadas.join(","));
    setPanelAbierto(false);
  };


 const renderSelectorPeriodo = () => {
   if (semanas.length === 0) return null;
 
   const semanasConDatos = semanas.filter((s) => s.cantidad > 0);
   const seleccionConDatos = semanasSeleccionadas.filter(
     (id) => semanas.find((s) => s.id === id)?.cantidad! > 0
   );
 
   const noHayCfdis = semanasConDatos.length === 0;
   const seleccionInvalida =
     semanasSeleccionadas.length > 0 && seleccionConDatos.length === 0;

  // ------------------------------
  // 4) Render mientras carga
  // ------------------------------
  if (!session || tipoCuenta === null) {
    return (
      <div className="flex justify-center items-center h-[60vh] text-gray-600">
        Cargando tu cuenta...
      </div>
    );
  }
 
   return (
     <div className="flex flex-col gap-2 mt-3">
       <p className={`${darkMode ? "text-gray-300" : "text-gray-800"}`}>
         Se detectaron <b>{cantidadCfdis}</b> CFDIs en total.
       </p>
       <p className="text-sm text-gray-500">
         Selecciona las semanas que deseas analizar (máx. 1000 CFDIs en total).
       </p>
 
       {/* Lista con scroll */}
       <div className="max-h-[200px] overflow-y-auto border rounded-lg p-2">
         {noHayCfdis ? (
           <div className="text-center text-gray-500 py-4">
             No existen CFDIs para procesar
           </div>
         ) : (
           semanas.map((sem) => (
             <label
               key={sem.id}
               className={`flex justify-between items-center py-2 px-3 cursor-pointer border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-shadow shadow-sm mb-1 ${
                 sem.cantidad === 0 ? "opacity-50 cursor-not-allowed" : ""
               }`}
             >
               <div className="flex items-center gap-3">
                 <input
                   type="checkbox"
                   checked={semanasSeleccionadas.includes(sem.id)}
                   onChange={() => sem.cantidad > 0 && toggleSemana(sem)}
                   className="w-5 h-5 accent-blue-600"
                   disabled={sem.cantidad === 0}
                 />
                 <span className="font-medium">{sem.label}</span>
               </div>
               <span
                 className={`text-sm ${
                   sem.cantidad === 0 ? "text-gray-400" : "text-gray-600"
                 }`}
               >
                 {sem.cantidad} CFDIs
               </span>
             </label>
           ))
         )}
       </div>
 
   {/* Div original — visible solo en pantallas medianas o mayores */}
   <div className="hidden lg:flex mt-2 flex-col gap-2">
     <div className="text-sm">
       <b>Total seleccionado:</b> {totalSeleccionado} CFDIs
     </div>
   
     {seleccionInvalida && (
       <div className="text-red-500 text-sm">
         Las semanas seleccionadas no contienen CFDIs válidos.
       </div>
     )}
   
     <button
       onClick={confirmarSeleccion}
       disabled={
         semanasSeleccionadas.length === 0 ||
         seleccionInvalida ||
         noHayCfdis
       }
       className={`px-4 py-2 rounded-md text-white transition ${
         semanasSeleccionadas.length === 0 ||
         seleccionInvalida ||
         noHayCfdis
           ? "bg-gray-400 cursor-not-allowed"
           : "bg-black hover:bg-gray-700"
       }`}
     >
       Confirmar selección
     </button>
   </div>
   
   {/* Div especial — visible solo en pantallas pequeñas */}
   <div
     className="
       fixed bottom-4 right-4 bg-white shadow-lg p-4 rounded-md z-50
       flex flex-col gap-2
       lg:hidden
     "
   >
     <div className="text-sm">
       <b>Total seleccionado:</b> {totalSeleccionado} CFDIs
     </div>
   
     {seleccionInvalida && (
       <div className="text-red-500 text-sm">
         Las semanas seleccionadas no contienen CFDIs válidos.
       </div>
     )}
            <button
              onClick={confirmarSeleccion}
              disabled={
                semanasSeleccionadas.length === 0 ||
                seleccionInvalida ||
                noHayCfdis
              }
              className={`px-4 py-2 rounded-md text-white transition ${
                semanasSeleccionadas.length === 0 ||
                seleccionInvalida ||
                noHayCfdis
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-black hover:bg-gray-700"
              }`}
            >
              Confirmar selección
            </button>
          </div>
       </div>
     );
   };
 
 
  const contextoListo =
    rfc && fechaInicio && fechaFin && periodoSeleccion && cantidadCfdis !== null;

  return (
    <div
      className={`flex flex-col h-[85vh] min-h-[600px] max-h-[950px] border rounded-2xl shadow-lg overflow-hidden w-full transition-all duration-300 ${
        darkMode ? "bg-gray-900 text-white" : "bg-white text-black"
      }`}
    >

      {tipoCuenta === "invitado" && invitePanelVisible && (
        <div
          className={
            `w-full border-b text-sm py-2 px-4 flex justify-between items-center ` +
            (darkMode
              ? "bg-yellow-900 border-yellow-700 text-yellow-200"
              : "bg-yellow-50 border-yellow-300 text-yellow-900"
            )
          }
        >
          <div className="font-semibold">
            Modo Invitado
          </div>
          <div className="font-mono">
            RFC: {rfc}
          </div>
        </div>
      )}
      
    {/* Panel de configuración */}
    <div
      className={`p-4 border-b flex flex-col gap-3 transition-all duration-300 ${
        darkMode ? "bg-gray-800 text-white" : "bg-gray-50 text-black"
      }`}
    >

  <div className="flex justify-between items-center">
    <h3 className="font-bold text-lg">Configuración de contexto</h3>

    <div className="flex gap-2 items-center">
      {/* 🌙 Botón modo oscuro */}
      <button
        onClick={() => setDarkMode((prev) => !prev)}
        className="p-2 rounded-full hover:bg-gray-700 transition"
        title={darkMode ? "Modo claro" : "Modo oscuro"}
      >
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Botón mostrar/ocultar panel */}
      {contextoListo && (
        <button
          onClick={() => setPanelAbierto((prev) => !prev)}
          className="px-2 py-1 text-sm rounded-md border hover:bg-gray-200 transition"
        >
          {panelAbierto ? "Ocultar" : "Mostrar"}
        </button>
      )}
    </div>
  </div>

  {/* Contenido del panel */}
  <div
    className={`overflow-hidden transition-[max-height,opacity] duration-500 ease-in-out
    ${panelAbierto ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}`}
  >
      <div
        className={`p-6 flex flex-wrap gap-4 items-center rounded-2xl transition-all duration-300 ${
          darkMode
            ? "bg-gray-900/70 backdrop-blur-md border border-gray-700 shadow-inner"
            : "bg-white/70 backdrop-blur-md border border-gray-200"
        }`}
      >
        {/* RFC, fechas y demás */}
        {(tipoCuenta === "empresarial" || tipoCuenta === "empleado") && (
          <div className="relative group w-60 mt-6">
            <select
              value={rfc}
              onChange={(e) => setRfc(e.target.value)}
              className="w-full pr-8 truncate appearance-none bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md p-2"
            >
              <option value="">Selecciona RFC</option>
              {clientes.map((c) => (
                <option key={c.rfc} value={c.rfc} className="truncate">
                  {c.nombre} ({c.rfc})
                </option>
              ))}
            </select>
        
            {/* Flecha personalizada */}
            <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 flex items-center transition-transform duration-200 group-focus-within:rotate-180">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        )}

        {/* Fecha Inicio */}
        <div className="flex flex-col">
          <label className={`${darkMode ? "text-gray-200" : "text-gray-800"} font-semibold mb-1`}>De:</label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className={`p-2 rounded-md border rounded-md border transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-400
              ${darkMode
                ? "bg-gray-900 text-white border-gray-700 placeholder-gray-400"
                : "bg-white text-black border-gray-300 placeholder-gray-500"
              }`}
          />
        </div>
  
        {/* Fecha Fin */}
        <div className="flex flex-col">
          <label className={`${darkMode ? "text-gray-200" : "text-gray-800"} font-semibold mb-1`}>A:</label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className={`p-2 rounded-md border transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-400
              ${darkMode
                ? "bg-gray-900 text-white border-gray-700 placeholder-gray-400"
                : "bg-white text-black border-gray-300 placeholder-gray-500"
              }`}
          />
        </div>
        {(tipoCuenta === "empresarial" || (tipoCuenta === "empleado" && !isConsulta)) && (
        <button
          onClick={() => setOpenGuestModal(true)}
          className={`
            px-3 py-2 mt-6 rounded-md border shadow-sm transition
            ${darkMode
              ? "border-gray-600 bg-gray-800 text-gray-100 hover:bg-gray-700"
              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
            }
          `}
        >
          Accesos
        </button>
        )}
       </div>      
      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-500 ease-in-out
          ${cantidadCfdis !== null ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}
      >
          {renderSelectorPeriodo()}
        </div>
      </div>
        <GuestKeyModal
          open={openGuestModal}
          onClose={() => setOpenGuestModal(false)}
          availableRfcs={clientes.map(c => ({ rfc: c.rfc, nombre: c.nombre }))}
        />
    </div>

      {/* Chat principal */}
    <div className="flex-1 p-6 overflow-auto space-y-4 scroll-smooth">
        {!contextoListo ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <h2 className="text-xl font-bold">
              Configura el contexto antes de iniciar el chat
            </h2>
            <p className="text-gray-400">
              Selecciona RFC (si aplica), el rango de fechas y el periodo de análisis.
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
            <h2 className="text-2xl font-bold">
              Empieza una conversación con tu asistente IA
            </h2>
            <p className="text-gray-400">
              Haz preguntas sobre tus <span className="text-blue-400">CFDIs</span>, gastos o ingresos.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              {[
                "Genera un análisis de flujo de efectivo",
                "Clasifica mis gastos por categoría",
                "¿Qué cliente me genera más ingresos?",
                "Resumen de ingresos del mes",
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(suggestion)}
                  className={`px-4 py-2 text-sm rounded-full shadow transition ${
                    darkMode
                      ? "bg-gray-700 hover:bg-gray-600"
                      : "bg-gray-950 hover:bg-gray-800 text-white"
                  }`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
           {messages.map((msg, i) => (
              <div key={i} className="space-y-2">
                <div
                  className={`p-3 rounded-xl shadow text-[14px] ${
                    msg.role === "user"
                      ? "bg-gray-100 text-black ml-auto max-w-[50%]"
                      : darkMode
                      ? "bg-gray-700/60 text-white max-w-[80%]"
                      : "bg-transparent text-black max-w-[80%]"
                  }`}
                >
                  {msg.content}
                </div>
            
                {/* Renderiza análisis si existe */}
                {msg.raw && (
                  <div
                    className={`max-w-[80%] ${
                      msg.role === "bot" ? "" : "ml-auto"
                    }`}
                  >
                    <AIResultRenderer data={msg.raw} />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="p-3 rounded-xl max-w-[70%] bg-gray-400/20 text-gray-400">
                Escribiendo...
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div
        className={`p-2 border-t flex gap-2 ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"
        }`}
      >
        <input
          type="text"
          className={`flex-1 p-2 rounded-lg border focus:outline-none focus:ring-2 ${
            darkMode
              ? "bg-gray-700 text-white border-gray-600 focus:ring-gray-500"
              : "bg-white text-black border-gray-500 focus:ring-gray-200"
          } ${!contextoListo ? "opacity-50 cursor-not-allowed" : ""}`}
          placeholder="Escribe tu pregunta..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={!contextoListo}
        />
        <button
          className={`px-4 rounded-lg transition ${
            contextoListo
              ? darkMode
                ? "bg-blue-600 text-white hover:bg-blue-500"
                : "bg-black text-white hover:bg-gray-600"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          onClick={() => contextoListo && handleSend()}
          disabled={!contextoListo}
        >
          Enviar
        </button>
      </div>
    </div>
  );
};
