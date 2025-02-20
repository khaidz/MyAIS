import React from "react";
import { Link } from "react-router-dom";
import { Row } from "reactstrap";

/*
totalElements
totalPage
currentPage
size
*/
const PaginationContainer = ({ page, onChangePage }) => {
  const renderPageNumbers = () => {
    const pageNumbers = [];
    let startPage, endPage;
    let currentPage = page.currentPage;
    let totalPage = page.totalPage;

    if (currentPage <= 3) {
      startPage = 1;
      endPage = Math.min(7, totalPage);
    } else if (currentPage >= totalPage - 3) {
      startPage = Math.max(1, totalPage - 6);
      endPage = totalPage;
    } else {
      startPage = currentPage - 3;
      endPage = currentPage + 3;
    }

    pageNumbers.push(
      <li className={currentPage > 1 ? "page-item" : "page-item disabled"} key={"previous"}>
        <Link to="#" className="page-link" onClick={() => onChangePage(currentPage - 1)}>
          Previous
        </Link>
      </li>
    );

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <React.Fragment key={i}>
          <li className="page-item">
            <Link to="#" className={currentPage === i ? "page-link active" : "page-link"} onClick={() => onChangePage(i)}>
              {i}
            </Link>
          </li>
        </React.Fragment>
      );
    }

    pageNumbers.push(
      <li className={currentPage < totalPage ? "page-item" : "page-item disabled"} key={"next"}>
        <Link to="#" className="page-link" onClick={() => onChangePage(currentPage + 1)}>
          Next
        </Link>
      </li>
    );

    return pageNumbers;
  };

  return (
    <Row className="align-items-center mt-2 g-3 text-center text-sm-start">
      <div className="col-sm">
        <div className="text-muted">
          Found <span className="fw-semibold">{page.totalElement}</span> {page.totalElement <= 1 ? "Result" : "Results"}
          {/* Showing<span className="fw-semibold ms-1">{page.size}</span> of <span className="fw-semibold">{page.totalElement}</span> Results */}
        </div>
      </div>
      <div className="col-sm-auto">
        <ul className="pagination pagination-separated pagination-md justify-content-center justify-content-sm-start mb-0">{renderPageNumbers()}</ul>
      </div>
    </Row>
  );
};

export default PaginationContainer;
