"use client";

import { Container } from "react-bootstrap";
import Generate from "./components/GeneracionDIOT";
import { withSessionGuard } from "@/app/providers/withSessionGuard";

function Content() {
  return (
    <Container fluid>
      <br />
      <Generate />
    </Container>
  );
}

export default withSessionGuard(Content);
