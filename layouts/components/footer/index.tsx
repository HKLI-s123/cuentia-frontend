import { appName, currentYear } from "@/helpers";
import { FaLinkedin, FaFacebook } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="footer py-3 border-top bg-white">
      <div className="container-fluid">
        <div
          className="
            d-flex
            flex-wrap
            align-items-center
            justify-content-center justify-content-md-between
            gap-2 gap-md-3
            text-center text-md-start
          "
        >
          {/* Texto */}
          <span className="text-muted">
            © 2025 - {currentYear} {appName}. Todos los derechos reservados.
          </span>

          {/* Links + redes */}
          <div className="d-flex flex-wrap align-items-center gap-2 gap-md-3 justify-content-center">
            <a href="/soporte" className="text-indigo-600 fw-semibold link-footer">
              Soporte
            </a>
            <a href="/privacidad" className="text-indigo-600 fw-semibold link-footer">
              Privacidad
            </a>
            <a href="/terminos" className="text-indigo-600 fw-semibold link-footer">
              Términos
            </a>
            <a href="/cookies" className="text-indigo-600 fw-semibold link-footer">
              Cookies
            </a>
            <a href="/aviso" className="text-indigo-600 fw-semibold link-footer">
              Aviso Legal
            </a>
            <a href="/nosotros" className="text-indigo-600 fw-semibold link-footer">
              Nosotros
            </a>
            <a href="/faqs" className="text-indigo-600 fw-semibold link-footer">
              FAQ's
            </a>

            <span className="text-muted mx-1">|</span>

            <a
              href="https://www.linkedin.com/company/cuentiamx/"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social"
              aria-label="LinkedIn"
            >
              <FaLinkedin />
            </a>

            <a
              href="https://www.facebook.com/profile.php?id=61585586518013"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social"
              aria-label="Facebook"
            >
              <FaFacebook />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
