"use client";

import { Container } from "react-bootstrap";
import { WhatsappBot } from "../../components/WhatsAppBot";
import { withSessionGuard } from "@/app/providers/withSessionGuard";

function Content() {
  return (
    <Container fluid>
      return <WhatsappBot />;
    </Container>
  );
}

export default withSessionGuard(Content);
