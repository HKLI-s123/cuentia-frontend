"use client";

import { Container } from "react-bootstrap";
import WhatsAppBot from './components/WhatsAppBot'
import { withSessionGuard } from "@/app/providers/withSessionGuard";

function Content() {
  return (
    <Container fluid>
      <br />
      <WhatsAppBot />
    </Container>
  );
}

export default withSessionGuard(Content);
