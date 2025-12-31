'use client';

import { loginUser, fetchMe } from "../services/authService";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import RecaptchaLoader from "@/components/RecaptchaLoader";
import { useGuestRedirect } from "@/hooks/useGuestRedirect";
import { Eye, EyeOff } from "lucide-react";
import Spinner from "@/components/Spinner";
import { GoogleLogin, useGoogleLogin } from "@react-oauth/google";
import { googleLogin } from "../services/authService";

export default function SignIn() {
  const [emailOrUser, setEmailOrUser] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ emailOrUser: "", password: "" });
  const [loadingL, setLoading] = useState(false);

  const router = useRouter();

  const { user, loading } = useGuestRedirect();
  // -------------------------------------
  // 🔍 VALIDACIÓN LOCAL
  // -------------------------------------
  const validateLogin = () => {
    let newErrors: any = {};

    // Email OR username
    if (!emailOrUser.trim()) {
      newErrors.emailOrUser = "Este campo es obligatorio.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const usernameRegex = /^[A-Za-z0-9_.-]{4,}$/;

      const isEmail = emailRegex.test(emailOrUser);
      const isUser = usernameRegex.test(emailOrUser);

      if (!isEmail && !isUser) {
        newErrors.emailOrUser = "Debe ser correo válido o usuario (mínimo 4 caracteres).";
      }
    }

    // Password simple pero segura
    if (!password.trim()) {
      newErrors.password = "La contraseña es obligatoria.";
    } else if (password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // -------------------------------------
  // 🔥 LOGIN
  // -------------------------------------
  const handleLogin = async (e: any) => {
    e.preventDefault();
    setErrors({    
    emailOrUser: "",
    password: "",
    });
    
    if (!validateLogin()) return;  // ❌ No disparamos reCaptcha si NO pasa validación

    if (loadingL) return;
    setLoading(true);

    try {
      const data = await loginUser(emailOrUser, password);

      // Guardar token en memoria temporal
      window.__accessToken = data.accessToken;

      const profile = await fetchMe();

      if (!profile) {
        router.push("/login");
        return;
      }

      if (!profile.verified) {
        router.push("/validar-cuenta");
        return;
      }

      router.push("/dashboard/overview");

    } catch (err: any) {
      toast.error(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = useGoogleLogin({
    flow: "implicit",
    onSuccess: async (tokenResponse) => {
      try {
        const googleToken = tokenResponse.access_token;
  
        const data = await googleLogin(googleToken);
  
        // Guardamos token
        window.__accessToken = data.accessToken;
  
        const profile = await fetchMe();
  
        if (!profile) return router.push("/login");
        if (!profile.verified) return router.push("/validar-cuenta");
  
        router.push("/dashboard/overview");
  
      } catch (err) {
        console.error(err);
        toast.error("Error con Google Login");
      }
    },
    onError: () => {
      toast.error("Google Login falló");
    }
  });

  if (loading || user) return <Spinner />;

  return (
   <>
    <RecaptchaLoader />
    <div className="flex min-h-screen">
      {/* Lado izquierdo */}
      <div className="hidden lg:flex w-1/2 bg-indigo-900 text-white flex-col justify-center items-center p-12">
        <img
          src="/logo_cuentia.png"
          alt="Logo de CuentIA"
          className="max-w-[350px] w-full h-auto object-contain"
        />
      </div>

      {/* Lado derecho */}
      <div className="flex w-full lg:w-1/2 justify-center items-center bg-gray-50 px-4">
        <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md">

          <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
            Entrar a mi cuenta
          </h1>

          <form onSubmit={handleLogin} className="space-y-5">

            {/* Email o usuario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico o usuario
              </label>
              <input
                type="text"
                placeholder="ejemplo@correo.com o usuario123"
                value={emailOrUser}
                onChange={(e) => setEmailOrUser(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              {errors.emailOrUser && (
                <p className="text-red-500 text-sm mt-1">{errors.emailOrUser}</p>
              )}
            </div>

            {/* Password */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type={showPassword ? "text" : "password"}  // 👈 AGREGADO
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />

              {/* ICONO OJO */}
              <div
                className="absolute right-3 top-[38px] cursor-pointer text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}

              <div className="text-right mt-2">
                <a href="/recuperar" className="text-sm text-indigo-600 hover:underline">
                  Olvidé mi contraseña
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingL}
              className={`w-full py-3 rounded-lg font-semibold transition
                ${loadingL ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700 text-white"}
              `}
            >
              {loadingL ? "Validando..." : "Iniciar sesión"}
            </button>
            {/* Línea divisora */}
            <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-gray-500 text-sm">o continuar con</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>
            
            {/* Botón personalizado Google */}
            <div className="w-full flex justify-center mt-2">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  try {
                    const googleToken = credentialResponse.credential;
                    if (!googleToken) {
                      toast.error("No se recibió token de Google");
                      return;
                    }
            
                    // 🔥 Llamar al service
                    const data = await googleLogin(googleToken);
            
                    window.__accessToken = data.accessToken;
            
                    const profile = await fetchMe();
            
                    if (!profile) return router.push("/login");
                    if (!profile.verified) return router.push("/validar-cuenta");

                    if (!profile.tipo_cuenta) {
                      return router.push("/google/setup");
                    }                    
                        
                  } catch (err) {
                    console.error(err);
                    toast.error("Error iniciando sesión con Google");
                  }
                }}
                onError={() => toast.error("Google Login falló")}
              />
            </div>

          </form>
          <p className="mt-6 text-center text-sm text-gray-500">
            ¿No tienes cuenta?{' '}
            <a href="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Regístrate
            </a>
          </p>

        </div>
      </div>
    </div>
   </>
  );
}
