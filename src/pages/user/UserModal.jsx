import React, { useEffect, useState } from "react";
import { Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from "reactstrap";
import Select from "react-select";
import makeAnimated from "react-select/animated";

import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import apiHelper from "../../helpers/api-helper";
import { toast } from "react-toastify";

import { defaultSelectStyle, lovRole } from "../../helpers/constants";

import Spinners from "../../components/Spinner";
import useUserStore from "../../store/useUserStore";
import { userService } from "../../services/user-service";

const schema = yup
  .object({
    username: yup.string().required("Tên đăng nhập là bắt buộc").matches("^.{3,30}$", "Tên đăng nhập có độ dài từ 3-30 ký tự"),
    password: yup.string().matches("^(?:.{6,30}|)$", "Mật khẩu có độ dài từ 6-30 ký tự"),
    email: yup.string().required("Email là bắt buộc").matches("^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$", "Email không hợp lệ"),
    fullName: yup.string().required("Họ và tên là bắt buộc"),
  })
  .required();

const defaultValues = {
  username: "",
  email: "",
  fullName: "",
  isDeleted: "0",
  roles: [],
  password: "",
  changePassword: false,
};

const statusOptions = [
  { label: "Hoạt động", value: 1 },
  { label: "Vô hiệu", value: 0 },
];

const UserModal = ({ data, isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    getValues,
    setValue,
    register,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: defaultValues,
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      if (data.id) {
        await userService.editUser(data.id, data);
        toast.success("Cập nhật người dùng thành công");
      } else {
        await userService.addUser(data);
        toast.success("Thêm người dùng thành công");
      }
      onClose({ needReload: true });
    } catch (err) {
      toast.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (data) {
      reset(data);
    } else {
      reset(defaultValues);
    }
  }, [isOpen, data, reset]);

  return (
    <Modal isOpen={isOpen} centered backdrop={"static"}>
      <ModalHeader
        className="bg-light p-3"
        toggle={() => {
          onClose();
        }}
      >
        {data?.id ? "Cập nhật" : "Thêm mới"}
      </ModalHeader>
      <ModalBody>
        {isLoading && <Spinners />}
        <div className="mb-3">
          <Label htmlFor="username-field" className="form-label">
            Tên đăng nhập
          </Label>
          <Controller
            name="username"
            control={control}
            render={({ field: { onChange, value } }) => (
              <Input id="username-field" className="form-control" placeholder="Tên đăng nhập" type="text" onChange={onChange} value={value || ""} invalid={!!errors.username} />
            )}
          />
          {errors.username && <div className="invalid-feedback">{errors.username.message}</div>}
        </div>
        <div className="mb-3">
          <Label htmlFor="password-field" className="form-label">
            Mật khẩu
          </Label>
          <Controller
            name="password"
            control={control}
            rules={{
              required: (data) => data.changePassword,
            }}
            render={({ field: { onChange, value } }) => (
              <div className="input-group">
                <div className="input-group-text">
                  <input className="form-check-input mt-0" type="checkbox" {...register("changePassword")} />
                </div>
                <Input id="password-field" className="form-control" placeholder="******" type="password" onChange={onChange} value={value || ""} invalid={!!errors.password} />
              </div>
            )}
          />
          {errors.password && <div className="invalid-feedback d-inline-block">{errors.password.message}</div>}
        </div>
        <div className="mb-3">
          <Label htmlFor="email-field" className="form-label">
            Email
          </Label>
          <Controller
            name="email"
            control={control}
            render={({ field: { onChange, value } }) => (
              <Input id="email-field" className="form-control" placeholder="Nhập địa chỉ email" type="text" onChange={onChange} value={value || ""} invalid={!!errors.email} />
            )}
          />
          {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
        </div>
        <div className="mb-3">
          <Label htmlFor="fullName-field" className="form-label">
            Họ và tên
          </Label>
          <Controller
            name="fullName"
            control={control}
            render={({ field: { onChange, value } }) => (
              <Input id="fullName-field" className="form-control" placeholder="Nhập họ và tên" type="text" onChange={onChange} value={value || ""} invalid={!!errors.fullName} />
            )}
          />
          {errors.fullName && <div className="invalid-feedback">{errors.fullName.message}</div>}
        </div>
        <div className="mb-3">
          <Label htmlFor="roles-field" className="form-label">
            Vai trò
          </Label>
          <Controller
            name="roles"
            control={control}
            render={({ field: { onChange, value } }) => {
              return (
                <Select
                  id="roles-field"
                  isMulti
                  options={lovRole}
                  value={lovRole.filter((x) => (value || []).includes(x.value))}
                  onChange={(e) => {
                    setValue(
                      "roles",
                      e.map((x) => x.value)
                    );
                  }}
                  components={makeAnimated}
                  styles={defaultSelectStyle}
                ></Select>
              );
            }}
          />
          {errors.roles && <div className="invalid-feedback">{errors.roles.message}</div>}
        </div>
        <div className="mb-3">
          <Label htmlFor="isDeleted-field" className="form-label">
            Trạng thái
          </Label>
          <Controller
            name="status"
            control={control}
            render={({ field: { onChange, value } }) => {
              return (
                <Select
                  id="status-field"
                  options={statusOptions}
                  defaultValue={{ label: "Hoạt động", value: 1 }}
                  value={statusOptions.find((x) => x.value === value)}
                  onChange={(e) => {
                    setValue("status", e.value);
                  }}
                  components={makeAnimated}
                ></Select>
              );
            }}
          />
          {errors.status && <div className="invalid-feedback">{errors.status.message}</div>}
        </div>
      </ModalBody>
      <ModalFooter className="position-relative">
        <div className="hstack gap-2 justify-content-end">
          <button
            type="button"
            className="btn btn-light"
            onClick={() => {
              onClose();
            }}
          >
            Đóng
          </button>
          <button type="submit" className="btn btn-primary" onClick={handleSubmit(onSubmit)} disabled={isLoading}>
            <span className="d-flex align-items-center g-2">{isLoading ? <Spinner size="sm" className="flex-shrink-0" /> : ""} Lưu</span>
          </button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default UserModal;
