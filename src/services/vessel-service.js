import vtTau1 from "../pages/map/data/Tau1.json"
import vtTau2 from "../pages/map/data/Tau2.json"
import vtTau3 from "../pages/map/data/Tau3.json"

class VesselService {
  getVesselList = async () => {
    return await new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            mmsi: "123456789",
            vesselName: "SEA_EMPEROR",
            vesselType: "1",
            imo: "123456789",
            callSign: "SEA_EMPEROR",
            clazz: "A",
            received: "2025-03-07 10:00:00",
            speed: "10",
            course: "10",
            points: vtTau1
          },
          {
            mmsi: "108293810",
            vesselName: "Đại Dương 1",
            vesselType: "2",
            imo: "123456789",
            callSign: "SEA_EMPEROR",
            clazz: "A",
            received: "2025-03-07 10:00:00",
            speed: "10",
            course: "10",
            points: vtTau2
          },
          {
            mmsi: "892748723",
            vesselName: "MSC CAPRI",
            vesselType: "3",
            imo: "123456789",
            callSign: "SEA_EMPEROR",
            clazz: "A",
            received: "2025-03-07 10:00:00",
            speed: "10",
            course: "10",
            points: vtTau3
          }
        ])
      }, 500)
    })
  }
}

export const vesselService = new VesselService()
