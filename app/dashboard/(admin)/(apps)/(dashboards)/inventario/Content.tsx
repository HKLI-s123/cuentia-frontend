"use client";

import { Container } from "react-bootstrap";
import Inventario from "./components/Inventario";
import { withSessionGuard } from "@/app/providers/withSessionGuard";

function Content() {
  return (
    <Container fluid>
      <br />
      <Inventario />
    </Container>
  );
}

export default withSessionGuard(Content);
