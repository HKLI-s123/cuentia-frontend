import { Suspense } from "react";
import TransferClient from "./TransferClient";

export default function Page() {
  return (
    <Suspense fallback={<TransferLoading />}>
      <TransferClient />
    </Suspense>
  );
}

function TransferLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center text-slate-300">
      Cargando información del pago…
    </div>
  );
}
