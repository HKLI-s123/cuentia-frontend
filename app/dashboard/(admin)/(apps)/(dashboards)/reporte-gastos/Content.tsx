"use client";

import { Container } from "react-bootstrap";
import WhatsAppGastos from './components/WhatsAppGastos'
import { withSessionGuard } from "@/app/providers/withSessionGuard";

function Content() {
  return (
    <Container fluid>
      <br />
      <WhatsAppGastos />
    </Container>
  );
}

export default withSessionGuard(Content);
