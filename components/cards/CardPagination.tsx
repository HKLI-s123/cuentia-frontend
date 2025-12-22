import { Col, Row } from "react-bootstrap";
import { TbChevronLeft, TbChevronRight } from "react-icons/tb";

type CardPaginationProps = {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  itemsName: string;
  onPageChange?: (page: number) => void;
};

const CardPagination = ({
  totalItems,
  itemsPerPage,
  currentPage,
  itemsName,
  onPageChange
}: CardPaginationProps) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePrev = () => {
    if (onPageChange && currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (onPageChange && currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <Row className="align-items-center justify-content-between text-center text-sm-start">
      <Col sm>
        <div className="text-muted">
          Showing{" "}
          <span className="fw-semibold">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
          <span className="fw-semibold">
            {currentPage * itemsPerPage > totalItems ? totalItems : currentPage * itemsPerPage}
          </span>{" "}
          of <span className="fw-semibold">{totalItems}</span> {itemsName}
        </div>
      </Col>
      <Col sm="auto" className="mt-3 mt-sm-0">
        <div>
          <ul className="pagination pagination-boxed mb-0 justify-content-center">
            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`} onClick={handlePrev} role="button">
              <span className="page-link">
                <TbChevronLeft />
              </span>
            </li>
            <li className="page-item active" role="button">
              <span className="page-link">{currentPage}</span>
            </li>
            <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`} onClick={handleNext} role="button">
              <span className="page-link">
                <TbChevronRight />
              </span>
            </li>
          </ul>
        </div>
      </Col>
    </Row>
  );
};

export default CardPagination;
