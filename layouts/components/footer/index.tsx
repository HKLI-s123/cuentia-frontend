import { appName, currentYear } from "@/helpers";

const Footer = () => {
    return (
        <footer className="footer py-3 border-top bg-white">
            <div className="container-fluid">
                <div className="row align-items-center justify-content-between">

                    {/* Texto izquierdo */}
                    <div className="col-md-6 text-center text-md-start text-muted">
                        © 2025 - {currentYear} {appName}. Todos los derechos reservados.
                    </div>

                    {/* Enlaces derecho */}
                    <div className="col-md-6 text-center text-md-end mt-2 mt-md-0">
                        <a href="/soporte" className="text-indigo-600 fw-semibold me-3 link-footer">
                            Soporte
                        </a>
                        <a href="/privacidad" className="text-indigo-600 fw-semibold me-3 link-footer">
                            Privacidad
                        </a>
                        <a href="/terminos" className="text-indigo-600 fw-semibold me-3 link-footer">
                            Términos
                        </a>
                        <a href="/cookies" className="text-indigo-600 fw-semibold me-3 link-footer">
                            Cookies
                        </a>
                        <a href="/aviso" className="text-indigo-600 fw-semibold me-3 link-footer">
                            Aviso Legal
                        </a>
                        <a href="/nosotros" className="text-indigo-600 fw-semibold me-3 link-footer">
                            Nosotros
                        </a>
                        <a href="/faqs" className="text-indigo-600 fw-semibold link-footer">
                            FAQ's
                        </a>
                    </div>

                </div>
            </div>
        </footer>
    );
};

export default Footer;
