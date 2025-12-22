"use client";

import "@/assets/scss/app.scss"; // si usas tu global
import { Container } from "react-bootstrap";

export default function SoporteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-page-wrapper">
      <Container className="py-4">
        {children}
      </Container>
    </div>
  );
}
