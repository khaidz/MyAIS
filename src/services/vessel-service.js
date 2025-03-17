import apiHelper from "../helpers/api-helper"

class VesselService {
  getLoaiTauLOV = async () => {
    return await apiHelper.post("/api/Ship/Data/DoRequest", {
      "procedureName": "Proc_DM_ShipType_Search",
      "thamSo": JSON.stringify({})
    })
  }

  getVesselList = async (thamSo) => {
    return await apiHelper.post("/api/Ship/Data/DoRequest", {
      "procedureName": "Proc_DM_Tau_Search",
      "thamSo": JSON.stringify(thamSo)
    })
  }

  getVesselRoute = async (thamSo) => {
    return await apiHelper.post("/api/Ship/Data/DoRequest", {
      "procedureName": "Proc_QL_HanhTrinh_Search",
      "thamSo": JSON.stringify(thamSo)
    })
  }
}

export const vesselService = new VesselService()
