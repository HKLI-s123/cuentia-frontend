"use client";

import { Container } from "react-bootstrap";
import List from "./components/ListComplementos";
import { withSessionGuard } from "@/app/providers/withSessionGuard";

function Content() {
  return (
    <Container fluid>
      <br />
      <List />
    </Container>
  );
}

export default withSessionGuard(Content);
