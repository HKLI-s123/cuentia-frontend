import { Suspense } from "react";
import VerificadoClient from "./VerificadoClient";

export default function Page() {
  return (
    <Suspense fallback={<VerificadoLoading />}>
      <VerificadoClient />
    </Suspense>
  );
}

function VerificadoLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">
      Cargando verificación…
    </div>
  );
}
