import { create } from "zustand"

const useAisStore = create((set) => ({
  vesselList: [],
  selectedVessel: null,
  loaiTauLOV: [],
  setSelectedVessel: (value) => {
    set(() => ({ selectedVessel: value }))
  },
  setVesselList: (value) => {
    set(() => ({ vesselList: value }))
    },
  setLoaiTauLOV: (value) => {
    set(() => ({ loaiTauLOV: value }))
  }
}))

export default useAisStore
