import List from "list.js";
import React, { useEffect, useState } from "react";
import { CardBody, Input } from "reactstrap";
import PaginationContainer from "./PaginationContainer";
import Spinners from "./Spinner";
import classNames from "classnames";
import { generateGUID } from "../helpers/common-helper";
import classnames from "classnames";
const TableContainer = ({ tableName, columns, data, showCheckbox, propKey, page, onChangePage, isLoading, style, tableClassName, changeSelectedData }) => {
  const [allChecked, setAllChecked] = useState(false);
  const [selectedData, setSelectedData] = useState([]);

  useEffect(() => {
    var options = {
      valueNames: columns.map((x) => x.prop),
    };
    new List(tableName, options);
  });

  const handleSelectAll = () => {
    let newValue = !allChecked;
    setAllChecked(newValue);
    if (newValue) {
      setSelectedData(data);
    } else {
      setSelectedData([]);
    }
  };

  const handleCheckboxChange = (item) => {
    const updateSelectedData = [...selectedData];
    let index = updateSelectedData.findIndex((x) => x[propKey] === item[propKey]);
    if (index < 0) {
      updateSelectedData.push(item);
    } else {
      updateSelectedData.splice(index, 1);
    }
    setSelectedData(updateSelectedData);
    if (updateSelectedData.length === data.length) {
      setAllChecked(true);
    } else {
      setAllChecked(false);
    }
  };

  useEffect(() => {
    if (changeSelectedData) {
      changeSelectedData(selectedData);
    }
  }, [selectedData]);

  useEffect(() => {
    setSelectedData([]);
  }, [data]);

  return (
    <CardBody className="pt-0">
      <div id={tableName} style={style}>
        <table className={classnames("table align-middle", { [tableClassName]: tableClassName })}>
          <thead className="table-light">
            <tr>
              {showCheckbox && (
                <th scope="col" style={{ width: "50px" }}>
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" onChange={handleSelectAll} checked={allChecked} />
                  </div>
                </th>
              )}
              {columns.map((item) => (
                <th key={item.prop} width={item.width ?? "auto"}>
                  {item.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={classNames("list position-relative", { "user-select-none": isLoading })}>
            {isLoading && (
              <tr style={{ borderStyle: "none" }}>
                <td colSpan={showCheckbox ? columns.length + 1 : columns.length} className="py-0">
                  <Spinners />
                </td>
              </tr>
            )}
            <tr className="d-none">
              {columns.map((item) => (
                <td key={item.prop} className={item.prop}>
                  {item.title}
                </td>
              ))}
            </tr>
            {data.length == 0 && (
              <tr>
                <td colSpan={showCheckbox ? columns.length + 1 : columns.length} className="text-center p-3" width={"100%"}>
                  No Result Found
                </td>
              </tr>
            )}
            {data.length > 0 &&
              data.map((item, index) => {
                return (
                  <tr key={index} className={classnames({ "bg-selected": selectedData.findIndex((x) => x[propKey] === item[propKey]) >= 0 })}>
                    {showCheckbox && (
                      <th scope="row">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            value={item[propKey]}
                            checked={selectedData.findIndex((x) => x[propKey] === item[propKey]) >= 0}
                            onChange={() => handleCheckboxChange(item)}
                          />
                        </div>
                      </th>
                    )}

                    {columns.map((column, index) => {
                      if (column.render) {
                        return (
                          <td key={generateGUID()} className={column.prop}>
                            {column.render(item, column)}
                          </td>
                        );
                      }
                      return (
                        <td key={generateGUID()} className={column.prop}>
                          {item[column.prop]}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
          </tbody>
        </table>
        {page && <PaginationContainer page={page} onChangePage={onChangePage} />}
      </div>
    </CardBody>
  );
};

export default TableContainer;
