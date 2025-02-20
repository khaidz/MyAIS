import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader, Col, Container, Form, Input, Row } from "reactstrap";
import BreadCrumb from "../../components/BreadCrumb";
import Select from "react-select";
import { Link } from "react-router-dom";
import List from "list.js";
import TableContainer from "../../components/TableContainer";
import apiHelper from "../../helpers/api-helper";
import useUserStore from "../../store/useUserStore";
import UserModal from "./UserModal";
import moment from "moment";
import { toast } from "react-toastify";
import { lovRole } from "../../helpers/constants";
import defineAbility from "../../helpers/casl/defineAbility";
import { useAuth } from "../../hooks/useAuth";
import PermissionDenied from "../../components/PermissionDenied";

const statusOption = [
  { label: "Tất cả", value: "" },
  { label: "Hoạt động", value: "1" },
  { label: "Vô hiệu", value: "0" },
];

const UserList = () => {
  document.title = "Quản lý người dùng | MyAIS";
  const {user} = useAuth();
  const ability = defineAbility(user);
  if(!ability.can('manage', 'User')){
    return <PermissionDenied/>
  }

  const [users, setUsers] = useState([]);
  const [page, setPage] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [searchText, setSearchText] = useState("");
  const [status, setStatus] = useState("");
  const [isOpenModal, setIsOpenModal] = useState(false);

  const [userEdit, setUserEdit] = useState(null);

  /* store */
  const userStore = useUserStore((state) => state);

  let columns = [
    {
      title: "Tên đăng nhập",
      prop: "username",
      width: "15%",
      render: (item, column) => {
        return <>{item[column.prop]}</>;
      },
    },
    {
      title: "Email",
      prop: "email",
      with: "15%",
    },
    {
      title: "Họ và tên",
      prop: "fullName",
      width: "18%",
    },
    {
      title: "Vai trò",
      prop: "roles",
      width: "12%",
      render: (item, column) => {
        return item[column.prop]
          .map((x) => (lovRole || []).find((r) => r.value === x))
          .filter((x) => !!x)
          .map((x) => x.label)
          .join(", ");
      },
    },
    {
      title: "Ngày cập nhật",
      prop: "updatedDate",
      width: "15%",
      render: (item, column) => {
        return moment(item[column.prop]).format("YYYY-MM-DD HH:mm:ss");
      },
    },
    {
      title: "Trạng thái",
      prop: "status",
      width: "10%",
      render: (item, column) => {
        if (item[column.prop] === 1) {
          return <span className="badge bg-success-subtle text-success">Hoạt động</span>;
        }
        return <span className="badge bg-danger-subtle text-danger">Vô hiệu</span>;
      },
    },
    {
      title: "Action",
      prop: "",
      width: "10%",
      render: (item, column) => {
        return (
          <>
            <ul className="list-inline hstack gap-2 mb-0">
              <li className="list-inline-item edit" title="Edit">
                <Link
                  to="#"
                  className="text-primary d-inline-block edit-item-btn"
                  onClick={() => {
                    setUserEdit(item);
                    setIsOpenModal(true);
                  }}
                >
                  <i className="ri-pencil-fill fs-16"></i>
                </Link>
              </li>
              {/* <li className="list-inline-item" title="Remove">
                <Link to="#" className="text-danger d-inline-block remove-item-btn" onClick={() => {}}>
                  <i className="ri-delete-bin-5-fill fs-16"></i>
                </Link>
              </li> */}
            </ul>
          </>
        );
      },
    },
  ];

  useEffect(() => {
    if (userStore?.search) {
      setSearchText(userStore.search.searchText);
      setStatus(userStore.search.status);
    }
  }, []);

  useEffect(() => {
    getDataUser();
  }, [currentPage]);

  const getDataUser = async () => {
    setIsLoading(true);
    try {
      let res = await apiHelper.get("/api/user/list", { page: currentPage, ...userStore.search });

      setUsers(res.contents);
      setPage(res.pageInfo);
    } catch (err) {
      console.log("error: ", err)
      toast.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = (data) => {
    setIsOpenModal(false);
    if (data?.needReload) {
      getDataUser();
    }
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Quản lý người dùng" pageTitle="Trang chủ" />
          <Row>
            <Col>
              <Card>
                <CardHeader className="border-0">
                  <div className="d-md-flex align-items-center">
                    <h5 className="card-title mb-3 mb-md-0 flex-grow-1">Danh sách người dùng</h5>
                    <div className="flex-shrink-0">
                      <div className="d-flex gap-1 flex-wrap">
                        <Button
                          color="success"
                          type="button"
                          className="add-btn"
                          onClick={() => {
                            setIsOpenModal(true);
                            setUserEdit(null);
                          }}
                        >
                          <i className="ri-add-line align-bottom me-1"></i>
                          Thêm
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardBody className="border border-dashed border-end-0 border-start-0 mb-3 z-2">
                  <Form>
                    <Row className="g-3">
                      <Col xl={4} lg={5} sm={6}>
                        <div className="search-box">
                          <Input
                            type="text"
                            className="form-control search"
                            placeholder="Nhập từ khoá tìm kiếm..."
                            value={searchText}
                            onChange={(event) => {
                              let value = event.target.value;
                              setSearchText(value);
                              userStore.setSearch({ ...userStore.search, searchText: value });
                            }}
                            onKeyUp={(event) => {
                              if (event.key === "Enter") {
                                getDataUser()
                              }
                            }}
                          />
                          <i className="ri-search-line search-icon"></i>
                        </div>
                      </Col>
                      <Col xxl={2} lg={3} sm={4}>
                        <div>
                          <Select
                            options={statusOption}
                            id="statusOption"
                            value={statusOption.find((x) => x.value == status)}
                            onChange={(e) => {
                              setStatus(e.value);
                              userStore.setSearch({ ...userStore.search, status: e.value });
                            }}
                          ></Select>
                        </div>
                      </Col>
                      <Col xl={2} lg={3} sm={2}>
                        <div>
                          <Button type="button" color="primary" className="btn" onClick={() => getDataUser()}>
                            <i className="ri-equalizer-fill me-1 align-bottom"></i>
                            Tìm kiếm
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </Form>
                </CardBody>
                <TableContainer
                  tableName="users"
                  propKey="id"
                  columns={columns}
                  data={users || []}
                  showCheckbox={true}
                  page={page}
                  onChangePage={(value) => setCurrentPage(value)}
                  isLoading={isLoading}
                ></TableContainer>
                <UserModal data={userEdit} isOpen={isOpenModal} onClose={closeModal} />
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default UserList;
