import React, { Fragment, useCallback, useEffect, useState } from "react"
import { Button, Col, Dropdown, DropdownMenu, DropdownToggle, Input, Label, Row } from "reactstrap"
import { genSvgColorUrl } from "../helpers/common-helper"
import useAisStore from "../store/useAisStore"
import { vesselService } from "../services/vessel-service"

const ConfigVessel = () => {
  const [isConfigVesselDropdown, setIsConfigVesselDropdown] = useState(false)
  const [danhSach, setDanhSach] = useState("tatCa")
  const [thietBi, setThietBi] = useState(["classA", "classB", "aToN", "baseStation"])
  const loaiTauLOV = useAisStore((state) => state.loaiTauLOV)
  const setLoaiTauLOV = useAisStore((state) => state.setLoaiTauLOV)
  const [loaiTau, setLoaiTau] = useState(loaiTauLOV.map((item) => item.id) || [])
  const setVesselList = useAisStore((state) => state.setVesselList)
  const vesselList = useAisStore((state) => state.vesselList)

  const toggleConfigVesselDropdown = () => {
    setIsConfigVesselDropdown(!isConfigVesselDropdown)
  }

  const handleThietBiChange = (type) => {
    setThietBi((prev) => {
      if (prev.includes(type)) {
        return prev.filter((item) => item !== type)
      }
      return [...prev, type]
    })
  }

  const handleLoaiTauChange = (type) => {
    setLoaiTau((prev) => {
      if (prev.includes(type)) {
        return prev.filter((item) => item !== type)
      }
      return [...prev, type]
    })
  }

  const getLoaiTauLOV = useCallback(async () => {
    try {
      const response = await vesselService.getLoaiTauLOV()
      console.log(response)
      setLoaiTauLOV(response?.DM_Tau || [])
    } catch (error) {
      console.error("Error fetching vessel list:", error) 
    }
  }, [setLoaiTauLOV])

  useEffect(() => {
    getLoaiTauLOV()
  }, [])

  const getVesselList = useCallback(async (thamSoObject = {}) => {
    try {
      const response = await vesselService.getVesselList(thamSoObject)
      const vessels = response?.DM_Tau || []
      setVesselList(vessels)
    } catch (error) {
      console.error("Error fetching vessel list:", error)
      toast.error("Có lỗi xảy ra khi tải danh sách tàu")
    }
  }, [])

  const handleApply = () => {
    getVesselList({
      "ShipType": loaiTau
    })
  }

  const renderLoaiTauCheckbox = (id, label, color = "#0f0") => (
    <Col md={3}>
      <div className="form-check form-check-info mb-3">
        <Input
          className="form-check-input"
          type="checkbox"
          id={id}
          checked={loaiTau.includes(id)}
          onChange={() => handleLoaiTauChange(id)}
        />
        <Label className="form-check-label d-flex align-items-center" htmlFor={id}>
          <img src={genSvgColorUrl(color)} alt={label} className="me-2" />
          {label}
        </Label>
      </div>
    </Col>
  )

  const renderConfigRow = (label, children) => (
    <Row className="mb-3">
      <Col md={2}>{label}</Col>
      <Col md={10} className="d-flex flex-row gap-4 flex-wrap">
        {children}
      </Col>
    </Row>
  )

  return (
    <React.Fragment>
      <Dropdown
        isOpen={isConfigVesselDropdown}
        toggle={toggleConfigVesselDropdown}
        className="topbar-head-dropdown ms-1 header-item bg-primary"
      >
        <DropdownToggle className="btn btn-primary bg-primary fs-16 text-white" style={{ borderColor: "transparent" }}>
          Hiển thị
          <i className="ri-arrow-down-s-line align-middle"></i>
        </DropdownToggle>
        <DropdownMenu className="dropdown-menu-lg p-0 dropdown-menu-end" style={{ width: "900px"}}>
          <div className="p-3 border-top-0 border-start-0 border-end-0 border bg-primary text-white">
            <Row className="align-items-center">
              <Col>
                <Row className="mb-3">
                  <Col md={2}>Danh sách</Col>
                  <Col md={10} className="d-flex flex-row gap-5 flex-wrap">
                    <div className="form-check form-radio-info mb-3">
                      <Input
                        className="form-check-input"
                        type="radio"
                        name="danhSach"
                        id={"tatCa"}
                        checked={danhSach === "tatCa"}
                        onChange={() => setDanhSach("tatCa")}
                      />
                      <Label className="form-check-label" htmlFor={"tatCa"}>
                        Tất cả
                      </Label>
                    </div>
                    <div className="form-check form-radio-info mb-3">
                      <Input
                        className="form-check-input"
                        type="radio"
                        name="danhSach"
                        id={"danhSachTheoDoi"}
                        checked={danhSach === "danhSachTheoDoi"}
                        onChange={() => setDanhSach("danhSachTheoDoi")}
                      />
                      <Label className="form-check-label" htmlFor={"danhSachTheoDoi"}>
                        Tàu trong danh sách theo dõi
                      </Label>
                    </div>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col md={2}>Thiết bị</Col>
                  <Col md={10} className="d-flex flex-row gap-5 flex-wrap">
                    <div className="form-check form-check-info mb-3">
                      <Input
                        className="form-check-input"
                        type="checkbox"
                        id={"classA"}
                        checked={thietBi.includes("classA")}
                        onChange={() => handleThietBiChange("classA")}
                      />
                      <Label className="form-check-label" htmlFor={"classA"}>
                        Class A
                      </Label>
                    </div>
                    <div className="form-check form-check-info mb-3">
                      <Input
                        className="form-check-input"
                        type="checkbox"
                        id={"classB"}
                        checked={thietBi.includes("classB")}
                        onChange={() => handleThietBiChange("classB")}
                      />
                      <Label className="form-check-label" htmlFor={"classB"}>
                        Class B
                      </Label>
                    </div>
                    <div className="form-check form-check-info mb-3">
                      <Input
                        className="form-check-input"
                        type="checkbox"
                        id={"aToN"}
                        checked={thietBi.includes("aToN")}
                        onChange={() => handleThietBiChange("aToN")}
                      />
                      <Label className="form-check-label" htmlFor={"aToN"}>
                        AtoN
                      </Label>
                    </div>
                    <div className="form-check form-check-info mb-3">
                      <Input
                        className="form-check-input"
                        type="checkbox"
                        id={"baseStation"}
                        checked={thietBi.includes("baseStation")}
                        onChange={() => handleThietBiChange("baseStation")}
                      />
                      <Label className="form-check-label" htmlFor={"baseStation"}>
                        Base station
                      </Label>
                    </div>
                  </Col>
                </Row>

                {renderConfigRow(
                  "Loại tàu",
                  <>
                    <div className="d-flex flex-row gap-5">
                      <div className="cursor-pointer text-decoration-underline" onClick={() => setLoaiTau([])}>
                        Bỏ chọn
                      </div>
                      <div
                        className="cursor-pointer text-decoration-underline"
                        onClick={() => setLoaiTau(loaiTauLOV.map((item) => item.id))}
                      >
                        Chọn tất cả
                      </div>
                    </div>
                  </>
                )}
                <Row className="mb-3" style={{ maxHeight: "500px", overflowY: "auto" }}>
                {(loaiTauLOV || []).map((item, index) => {
                  return <Fragment key={index}>
                  {renderLoaiTauCheckbox(item.id, item.valuess, item.color)}
                  </Fragment>
                })}
                </Row>
              </Col>
            </Row>
            <Row className="mb-3">
              <Col md={12} className="d-flex justify-content-center">
                <Button color="info" onClick={() => { handleApply(); setIsConfigVesselDropdown(false); }}>Áp dụng</Button>
              </Col>
            </Row>
          </div>
        </DropdownMenu>
      </Dropdown>
    </React.Fragment>
  )
}

export default ConfigVessel
