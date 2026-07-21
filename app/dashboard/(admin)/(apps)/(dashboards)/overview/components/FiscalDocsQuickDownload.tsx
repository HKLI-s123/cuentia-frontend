"use client";

import { Button, Badge } from "react-bootstrap";
import { TbFileTypePdf } from "react-icons/tb";
import { toast } from "sonner";
import {
  FISCAL_DOCS_ENABLED,
  downloadCsf,
  downloadOpinion,
} from "@/app/services/fiscalDocsService";

type Props = {
  rfc: string;
};

const FiscalDocsQuickDownload = ({ rfc }: Props) => {
  const handleDownload = async (kind: "csf" | "opinion") => {
    if (!rfc) return toast.warning("Selecciona un RFC");
    try {
      if (kind === "csf") await downloadCsf(rfc);
      else await downloadOpinion(rfc);
    } catch (error: any) {
      toast.error(error?.message || "No se pudo descargar el documento");
    }
  };

  return (
    <div className="p-3 mb-4 border rounded-3 d-flex flex-wrap align-items-center gap-2">
      <span className="fw-semibold text-secondary me-2" style={{ fontSize: "0.85rem" }}>
        Documentos fiscales
        {!FISCAL_DOCS_ENABLED && (
          <Badge bg="secondary" className="ms-2">
            Próximamente
          </Badge>
        )}
      </span>
      <Button
        size="sm"
        variant="outline-secondary"
        disabled={!FISCAL_DOCS_ENABLED || !rfc}
        onClick={() => handleDownload("csf")}
      >
        <TbFileTypePdf className="me-1" /> Descargar CSF
      </Button>
      <Button
        size="sm"
        variant="outline-secondary"
        disabled={!FISCAL_DOCS_ENABLED || !rfc}
        onClick={() => handleDownload("opinion")}
      >
        <TbFileTypePdf className="me-1" /> Descargar Opinión
      </Button>
    </div>
  );
};

export default FiscalDocsQuickDownload;
