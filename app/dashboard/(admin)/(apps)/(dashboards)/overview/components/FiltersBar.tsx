"use client";

import { Row, Col, Form } from "react-bootstrap";
import { useEffect, useState } from "react";

  type ClienteRFC = {
    rfc: string;
    nombre: string;
  };

  type Props = {
    tipoCuenta: "individual" | "empresarial";
    selectedRfc: string;
    setSelectedRfc: (v: string) => void;
    rfcList?: ClienteRFC[];
  };
  
  const FiltersBar = ({
    tipoCuenta,
    selectedRfc,
    setSelectedRfc,
    rfcList = [],
  }: Props) => {

  const [isDark, setIsDark] = useState(false);

  // detectar si el html tiene data-bs-theme="dark"
  useEffect(() => {
    const htmlTag = document.documentElement;

    const observer = new MutationObserver(() => {
      setIsDark(htmlTag.getAttribute("data-bs-theme") === "dark");
    });

    observer.observe(htmlTag, { attributes: true });

    setIsDark(htmlTag.getAttribute("data-bs-theme") === "dark"); // inicial

    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="p-3 mb-4 border rounded-3"
      style={{
        backgroundColor: isDark ? "#1d1f25" : "#ffffff",
        borderColor: isDark ? "#333" : "#e4e7ec",
      }}
    >
      <Row className="g-3 align-items-end">

        {tipoCuenta === "empresarial" && (
          <Col xs={12} md="auto">
            <Form.Group controlId="selectRfc">
              <Form.Label
                className="fw-semibold text-secondary"
                style={{ fontSize: "0.75rem", letterSpacing: "0.3px" }}
              >
                RFC
              </Form.Label>

              <Form.Select
                size="sm"
                value={selectedRfc}
                onChange={(e) => setSelectedRfc(e.target.value)}
                style={{
                  minWidth: "230px",
                  borderRadius: "8px",
                  borderColor: isDark ? "#444" : "#d0d5dd",
                  fontSize: "0.85rem",
                  paddingTop: "0.35rem",
                  paddingBottom: "0.35rem",
                  backgroundColor: isDark ? "#262626" : "#fff",
                  color: isDark ? "#e5e5e5" : "#000",
                }}
              >
                <option value="">— Selecciona RFC —</option>
                {rfcList.map((c) => (
                  <option key={c.rfc} value={c.rfc}>
                      {c.nombre} ({c.rfc})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        )}

      </Row>
    </div>
  );
};

export default FiltersBar;
