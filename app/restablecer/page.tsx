import { Suspense } from "react";
import RestablecerClient from "./RestablecerClient";

export default function Page() {
  return (
    <Suspense fallback={<RestablecerLoading />}>
      <RestablecerClient />
    </Suspense>
  );
}

function RestablecerLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">
      Cargando…
    </div>
  );
}
