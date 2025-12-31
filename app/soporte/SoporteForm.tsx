"use client";

import { useEffect, useState } from "react";
import { Card, Col, Form, Row, Button } from "react-bootstrap";
import { toast } from "sonner";
import { sendSupportRequest, type SupportCategory } from "@/app/services/supportService";
import { getSessionInfo } from "@/app/services/authService";
import { TbBrandWhatsapp, TbMail, TbMessage2, TbPhone, TbSend } from "react-icons/tb";

export default function SoporteForm() {
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    category: "" as SupportCategory | "",
    message: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getSessionInfo();
        setSession(data);
        setForm((prev) => ({
          ...prev,
          name: data?.nombre || "",
          email: data?.email || "",
        }));
      } catch (err) {
        console.error("Error cargando sesión en soporte:", err);
      }
    };
    load();
  }, []);

  console.log(session);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Por favor completa al menos tu nombre, correo y mensaje.");
      return;
    }

    setLoading(true);
    try {
      await sendSupportRequest({
        name: form.name,
        email: form.email,
        subject: form.subject || undefined,
        category: (form.category || undefined) as SupportCategory | undefined,
        message: form.message,
      });

      toast.success("Tu solicitud de soporte ha sido enviada. Te contactaremos pronto.");
      setForm((prev) => ({
        ...prev,
        subject: "",
        category: "" as SupportCategory | "",
        message: "",
      }));
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Ocurrió un error al enviar tu solicitud de soporte.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-3 support-form-scale">
      <Row className="justify-content-center">
        <Col lg={10}>
        <div className="mb-3">
          {session?.verified ? (
            // 👉 Usuario verificado → puede ir al dashboard
            <a
              href="/dashboard/overview"
              className="text-indigo-600 hover:text-indigo-800 hover:underline fw-semibold d-flex align-items-center gap-2"
            >
              ← Volver al dashboard
            </a>
          ) : (
            // ❌ Usuario NO verificado → NO permitir ir al dashboard
            <a
              href="/login"
              className="text-gray-600 hover:text-gray-800 hover:underline fw-semibold d-flex align-items-center gap-2"
            >
              ← Regresar
            </a>
          )}
        </div>
          <Row className="g-3">
            {/* Columna info */}
            <Col lg={4}>
              <Card className="shadow-none support-form-scale">
                <Card.Body>
                  <h4 className="mb-2">Centro de soporte</h4>
                  <p className="text-muted mb-3">
                    ¿Tienes problemas con tus CFDI, el bot de WhatsApp o la configuración fiscal?
                    Envíanos un mensaje y te ayudaremos lo antes posible.
                  </p>

                  <div className="mb-3">
                    <h6 className="mb-1">Contacto directo</h6>
                    <p className="mb-1 d-flex align-items-center gap-2">
                      <TbMail /> soporte@cuentia.mx
                    </p>
                       <p className="mb-1 d-flex align-items-center gap-2">
                      <TbPhone /> +52 656 405 3919
                    </p>
                    <p className="mb-1 d-flex align-items-center gap-2">
                      <TbBrandWhatsapp className="text-green-500" />  
                      <a href="https://wa.me/526564053919" target="_blank" className="text-reset">
                        WhatsApp directo
                      </a>
                    </p>
                  </div>
                  <div className="p-2 rounded-3 bg-indigo-50 border border-indigo-100 small">
                    <strong>Tip:</strong> mientras más detalles compartas (RFC, periodo, módulo, pantallazo),
                    más rápido podremos ayudarte.
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Columna formulario */}
            <Col lg={8}>
              <Card className="shadow-none">
                <Card.Body>
                  <h5 className="mb-3 d-flex align-items-center gap-2">
                    <TbMessage2 /> Enviar solicitud de soporte
                  </h5>

                  <Form onSubmit={handleSubmit}>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group controlId="supportName">
                          <Form.Label>Nombre</Form.Label>
                          <Form.Control
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Tu nombre"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group controlId="supportEmail">
                          <Form.Label>Correo electrónico</Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="tu@correo.com"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="g-3 mt-1">
                      <Col md={6}>
                        <Form.Group controlId="supportSubject">
                          <Form.Label>Asunto</Form.Label>
                          <Form.Control
                            type="text"
                            name="subject"
                            value={form.subject}
                            onChange={handleChange}
                            placeholder="Ej. Problema al cargar CFDIs"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group controlId="supportCategory">
                          <Form.Label>Categoría</Form.Label>
                          <Form.Select
                            name="category"
                            value={form.category}
                            onChange={handleChange}
                          >
                            <option value="">Selecciona una opción</option>
                            <option value="Problema técnico">Problema técnico</option>
                            <option value="Facturación">Facturación</option>
                            <option value="Dudas generales">Dudas generales</option>
                            <option value="Reporte de CFDI">Reporte de CFDI</option>
                            <option value="Sugerencia">Sugerencia</option>
                            <option value="Otro">Otro</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mt-3" controlId="supportMessage">
                      <Form.Label>Mensaje</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={5}
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        placeholder="Cuéntanos qué sucede, en qué módulo y desde cuándo. Si aplica, incluye RFC y periodo."
                      />
                    </Form.Group>

                    <div className="mt-4 d-flex justify-content-end">
                      <Button type="submit" disabled={loading}>
                        <TbSend className="me-1" />
                        {loading ? "Enviando..." : "Enviar a soporte"}
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
}
