import Feature from "ol/Feature"
import Map from "ol/Map"
import Overlay from "ol/Overlay"
import View from "ol/View"
import { GeoJSON } from "ol/format"
import LineString from "ol/geom/LineString"
import Point from "ol/geom/Point"
import TileLayer from "ol/layer/Tile"
import VectorLayer from "ol/layer/Vector"
import "ol/ol.css"
import { fromLonLat } from "ol/proj"
import { XYZ } from "ol/source"
import VectorSource from "ol/source/Vector"
import { Fill, Icon, Stroke, Style } from "ol/style"
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "react-toastify"
import { Button, Card, CardBody, Container, ListGroup, ListGroupItem, Spinner } from "reactstrap"
import { vesselService } from "../../services/vessel-service"

// Import map data
import { tranformApiData } from "../../helpers/common-helper"
import useAisStore from "../../store/useAisStore"
import hoangSa from "./data/HoangSa.json"
import offshore from "./data/Offshore.json"
import truongSa from "./data/TruongSa.json"
import Select from "react-select"

// Constants
const INITIAL_CENTER = [106.81196689833655, 20.728998788877234]
const INITIAL_ZOOM = 11

const MAP_STYLES = {
  boundary: new Style({
    fill: new Fill({ color: "rgba(87, 207, 243, 0.6)" }),
    stroke: new Stroke({ color: "rgba(87, 207, 243, 0.7)", width: 2 })
  }),
  offshore: new Style({
    stroke: new Stroke({ color: "rgba(31, 124, 247, 0.7)", width: 2 })
  })
}

const createVesselFeature = (vessel) => {
  let color = vessel.ShipTypeColor || "cyan"
  const feature = new Feature({
    geometry: new Point(fromLonLat([vessel.Longitude, vessel.Latitude])),
    type: "vessel",
    data: vessel
  })

  const svgSize = vessel.AidTypeID ? 12 : 24
  const svg = vessel.AidTypeID
    ? `
    <svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${svgSize}" height="${svgSize}" stroke="red" fill="#f3e3e3" stroke-width="2"/>
      <circle cx="${svgSize / 2}" cy="${svgSize / 2}" r="2" fill="red" stroke="red" stroke-width="1"/>
    </svg>
  `
    : `
    <svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.437 17.608 3.354 22.828l8.336 -21.536 8.337 21.536L11.944 17.608l-0.253 -0.163 -0.254 0.163Z" stroke="#545D66" stroke-width="0.9" fill="${color.trim()}"></path>
    </svg>
  `
  const svgUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg)
  feature.setStyle(
    new Style({
      image: new Icon({
        src: svgUrl,

        scale: 0.8,
        imgSize: [svgSize, svgSize],
        rotation: vessel.AidTypeID ? 45 : vessel.CourseOverGround || 0
      })
    })
  )

  return feature
}

const createPathFeatures = (points) => {
  if (!points?.length) return []
  const lineFeature = new Feature({
    geometry: new LineString(points.map((point) => fromLonLat([point.longitude, point.latitude]))),
    type: "path"
  })

  lineFeature.setStyle(
    new Style({
      stroke: new Stroke({ color: "#3388ff", width: 2, lineDash: [10, 10] })
    })
  )

  const startFeature = new Feature({
    geometry: new Point(fromLonLat([points[points.length - 1].longitude, points[points.length - 1].latitude])),
    type: "path"
  })

  startFeature.setStyle(
    new Style({
      image: new Icon({
        src: `src/assets/images/vessel/ship.png`,
        scale: 0.2
      })
    })
  )

  return [lineFeature, startFeature]
}

const InfoPanel = memo(
  ({
    isPanelOpen,
    selectedVessel,
    getVesselRoute,
    isLoading,
    setSelectedVessel,
    viewingRoute,
    setViewingRoute,
    renderPath,
    selectedTime,
    setSelectedTime
  }) => (
    <div
      id="infoPanel"
      className="info-panel"
      style={{
        right: isPanelOpen ? 0 : "-24%"
      }}
    >
      <div className="">
        <h4>Thông tin tàu</h4>
        <span
          className="position-absolute fs-24 cursor-pointer"
          onClick={() => setSelectedVessel(null)}
          style={{ top: "5px", right: "20px" }}
        >
          <i className="ri-close-line"></i>
        </span>
      </div>

      {!selectedVessel?.AidTypeID && (
        <>
          <ListGroup>
            <ListGroupItem>
              <b>Name: </b> {selectedVessel?.VesselName ?? "N/A"}
            </ListGroupItem>
            <ListGroupItem>
              <b>MMSI: </b> {selectedVessel?.MMSI ?? "N/A"}
            </ListGroupItem>
            <ListGroupItem>
              <b>IMO: </b> {selectedVessel?.IMONumber ?? "N/A"}
            </ListGroupItem>
            <ListGroupItem>
              <b>Call sign: </b> {selectedVessel?.CallSign ?? "N/A"}
            </ListGroupItem>
            <ListGroupItem>
              <b>Latitude/Longitude: </b> {selectedVessel?.Latitude ?? "N/A"}/ {selectedVessel?.Longitude ?? "N/A"}
            </ListGroupItem>
            <ListGroupItem>
              <b>Destination: </b> {selectedVessel?.Destination ?? "N/A"}
            </ListGroupItem>
            <ListGroupItem>
              <b>ShipLength: </b> {selectedVessel?.ShipLength ?? "N/A"}
            </ListGroupItem>
            <ListGroupItem>
              <b>ShipWidth: </b> {selectedVessel?.ShipWidth ?? "N/A"}
            </ListGroupItem>
          </ListGroup>
          <div className="text-center d-flex flex-row gap-2 align-items-center mt-3">
            <Select
              options={[
                { value: "1", label: "1H" },
                { value: "3", label: "3H" },
                { value: "6", label: "6H" },
                { value: "12", label: "12H" },
                { value: "24", label: "24H" },
                { value: "48", label: "48H" },
                { value: "72", label: "72H" }
              ]}
              value={selectedTime}
              onChange={(e) => {
                setSelectedTime(e)
              }}
            />
            <Button
              className="d-inline-flex align-items-center justify-content-center"
              color="primary"
              onClick={() => getVesselRoute(selectedVessel?.MMSI)}
              disabled={!selectedVessel?.MMSI || isLoading}
            >
              {isLoading && <Spinner size="sm" className="me-2" />}
              Xem hành trình
            </Button>
            {viewingRoute && selectedVessel?.MMSI === viewingRoute && (
              <Button color="primary" onClick={() => setViewingRoute(null)} className="flex-grow-1">
                Ẩn hành trình
              </Button>
            )}
          </div>
        </>
      )}
      {!!selectedVessel?.AidTypeID && (
        <>
          <ListGroup>
            <ListGroupItem>
              <b>MMSI: </b> {selectedVessel?.MMSI ?? "N/A"}
            </ListGroupItem>
            <ListGroupItem>
              <b>Type Of Aid To Navigation: </b> {selectedVessel?.AidType ?? "N/A"}
            </ListGroupItem>
            <ListGroupItem>
              <b>Dimension: </b> {selectedVessel?.ShipLength ?? "N/A"}/{selectedVessel?.ShipWidth ?? "N/A"}
            </ListGroupItem>
            <ListGroupItem>
              <b>Position: </b> {selectedVessel?.Longitude ?? "N/A"}/{selectedVessel?.Latitude ?? "N/A"}
            </ListGroupItem>
            <ListGroupItem>
              <b>Time Of Position: </b> {selectedVessel?.DateTimeUTC ?? "N/A"}
            </ListGroupItem>
          </ListGroup>
        </>
      )}
    </div>
  )
)

const AISMap = () => {
  document.title = "Bản đồ tàu thuyền"

  const mapRef = useRef()
  const overlayRef = useRef()
  const mapInstance = useRef()
  const [isLoading, setIsLoading] = useState(false)
  const [viewingRoute, setViewingRoute] = useState(null)
  const selectedVessel = useAisStore((state) => state.selectedVessel)
  const setSelectedVessel = useAisStore((state) => state.setSelectedVessel)
  const vesselList = useAisStore((state) => state.vesselList)
  const setVesselList = useAisStore((state) => state.setVesselList)
  const vectorSource = useMemo(() => new VectorSource(), [])
  const [selectedTime, setSelectedTime] = useState({ value: "1", label: "1H" })
  const renderVessels = useCallback(
    (vessels) => {
      vectorSource
        .getFeatures()
        .filter((feature) => ["vessel", "path"].includes(feature.get("type")))
        .forEach((feature) => vectorSource.removeFeature(feature))

      vessels.forEach((vessel) => {
        vectorSource.addFeature(createVesselFeature(tranformApiData(vessel)))
      })
    },
    [vectorSource]
  )

  const renderPath = useCallback(
    (points) => {
      vectorSource
        .getFeatures()
        .filter((feature) => feature.get("type") === "path")
        .forEach((feature) => vectorSource.removeFeature(feature))

      createPathFeatures(points).forEach((feature) => vectorSource.addFeature(feature))
    },
    [vectorSource]
  )

  const getVesselList = useCallback(
    async (thamSoObject = {}) => {
      try {
        const response = await vesselService.getVesselList(thamSoObject)
        const vessels = response?.DM_Tau || []
        setVesselList(vessels)
        renderVessels(vessels)
      } catch (error) {
        console.error("Error fetching vessel list:", error)
        toast.error("Có lỗi xảy ra khi tải danh sách tàu")
      }
    },
    [renderVessels]
  )

  useEffect(() => {
    renderVessels(vesselList)
  }, [vesselList])

  const getVesselRoute = async (MMSI) => {
    if (!MMSI) return

    try {
      setIsLoading(true)
      const response = await vesselService.getVesselRoute({ MMSI: MMSI, Hours: selectedTime?.value || 72 })
      const points = (response?.DM_HanhTrinh || []).map((item) => ({
        longitude: item.Longitude,
        latitude: item.Latitude
      }))
      renderPath(points)
      setViewingRoute(MMSI)

      // Zoom lại điểm bắt đầu với hiệu ứng
      if (points.length > 0) {
        const startPoint = fromLonLat([points[0].longitude, points[0].latitude])
        const view = mapInstance.current.getView()
        view.setCenter(startPoint)
        // Thêm hiệu ứng zoom
        view.animate({
          zoom: 11,
          duration: 1500 // Thời gian hiệu ứng zoom
        })
      }
    } catch (error) {
      console.error("Error fetching vessel route:", error)
      toast.error("Có lỗi xảy ra khi tải hành trình tàu")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    getVesselList()

    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new XYZ({
            url: "http://mt0.google.com/vt/lyrs=p&hl=vi&x={x}&y={y}&z={z}"
          }),
          visible: true,
          title: "ggterrain"
        }),
        new VectorLayer({ source: vectorSource })
      ],
      view: new View({
        center: fromLonLat(INITIAL_CENTER),
        zoom: INITIAL_ZOOM
      })
    })
    mapInstance.current = map

    const infoOverlay = new Overlay({
      element: document.getElementById("mapInfo"),
      positioning: "bottom-center",
      stopEvent: false
    })
    map.addOverlay(infoOverlay)
    overlayRef.current = infoOverlay

    const geojsonFormat = new GeoJSON()
    const addFeatures = (data, style) => {
      const features = geojsonFormat.readFeatures(data, { featureProjection: "EPSG:3857" })
      features.forEach((f) => f.setStyle(style))
      vectorSource.addFeatures(features)
    }

    // Add boundary features
    addFeatures(hoangSa, MAP_STYLES.boundary)
    addFeatures(truongSa, MAP_STYLES.boundary)
    addFeatures(offshore, MAP_STYLES.offshore)

    // Handle vessel click
    map.on("singleclick", (event) => {
      const feature = map.forEachFeatureAtPixel(event.pixel, (feat) => feat)
      if (feature?.get("type") === "vessel") {
        setSelectedVessel(tranformApiData(feature.get("data")))
      }
    })

    // Set up interval to refresh vessel list every 20 seconds
    const intervalId = setInterval(() => {
      getVesselList()
    }, 20000)

    return () => {
      map.setTarget(undefined)
      overlayRef.current?.setPosition(undefined)
      clearInterval(intervalId) // Clean up interval when component unmounts
    }
  }, [vectorSource, getVesselList])

  return (
    <React.Fragment>
      <div className="page-content pb-0">
        <Container fluid className="ms-0 px-0">
          <Card className="mb-0">
            <CardBody style={{ position: "relative", height: "calc(100vh - 75px)", overflow: "hidden" }}>
              <div
                ref={mapRef}
                style={{
                  width: "100%",
                  height: "100%",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  zIndex: 1
                }}
              ></div>
              <InfoPanel
                renderPath={renderPath}
                isPanelOpen={selectedVessel}
                selectedVessel={selectedVessel}
                getVesselRoute={getVesselRoute}
                isLoading={isLoading}
                setSelectedVessel={setSelectedVessel}
                viewingRoute={viewingRoute}
                setViewingRoute={setViewingRoute}
                selectedTime={selectedTime}
                setSelectedTime={setSelectedTime}
              />
            </CardBody>
          </Card>
        </Container>
      </div>
    </React.Fragment>
  )
}

export default AISMap
