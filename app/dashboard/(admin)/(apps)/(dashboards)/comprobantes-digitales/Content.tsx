"use client";

import { Container } from "react-bootstrap";
import WhatsAppComprobantes from './components/WhatsappComprobantes'
import { withSessionGuard } from "@/app/providers/withSessionGuard";

function Content() {
  return (
    <Container fluid>
      <br />
      <WhatsAppComprobantes />
    </Container>
  );
}

export default withSessionGuard(Content);
