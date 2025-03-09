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
import OSM from "ol/source/OSM"
import VectorSource from "ol/source/Vector"
import { Fill, Icon, Stroke, Style } from "ol/style"
import React, { useEffect, useRef, useState, useCallback, useMemo, memo } from "react"
import { Button, Card, CardBody, Col, Container, ListGroup, ListGroupItem, Row, Spinner } from "reactstrap"
import { toast } from "react-toastify"
import { vesselTypes } from "../../helpers/constants"
import { vesselService } from "../../services/vessel-service"

// Import map data
import hoangSa from "./data/HoangSa.json"
import offshore from "./data/Offshore.json"
import truongSa from "./data/TruongSa.json"
import Select from "react-select"
// Constants
const INITIAL_CENTER = [107.5698, 16.4637]
const INITIAL_ZOOM = 6

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
  console.log(vessel)
  const feature = new Feature({
    geometry: new Point(fromLonLat([vessel.Longitude, vessel.Latitude])),
    type: "vessel",
    data: vessel
  })

  const vesselType = vesselTypes.find((type) => type.type == vessel.ShipType)
  console.log(vesselType)
  feature.setStyle(
    new Style({
      image: new Icon({
        src: `src/assets/images/vessel/${vesselType?.name || "UnspecifiedShips"}.png`,
        scale: 0.8
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
    geometry: new Point(fromLonLat([points[0].longitude, points[0].latitude])),
    type: "path"
  })

  startFeature.setStyle(
    new Style({
      image: new Icon({
        src: `src/assets/images/vessel/star.png`,
        scale: 0.1
      })
    })
  )

  return [lineFeature, startFeature]
}

const InfoPanel = memo(({ isPanelOpen, selectedVessel, getVesselRoute, isLoading }) => (
  <div
    id="infoPanel"
    className="info-panel"
    style={{
      right: isPanelOpen ? 0 : "-24%"
    }}
  >
    <h4>Thông tin tàu</h4>
    <ListGroup>
      <ListGroupItem>
        <b>Name: </b> {selectedVessel?.VesselName}
      </ListGroupItem>
      <ListGroupItem>
        <b>MMSI: </b> {selectedVessel?.MMSI}
      </ListGroupItem>
      <ListGroupItem>
        <b>IMO: </b> {selectedVessel?.IMONumber}
      </ListGroupItem>
      <ListGroupItem>
        <b>Call sign: </b> {selectedVessel?.CallSign}
      </ListGroupItem>
      <ListGroupItem>
        <b>Latitude/Longitude: </b> {selectedVessel?.Latitude}/ {selectedVessel?.Longitude}
      </ListGroupItem>
      <ListGroupItem>
        <b>Destination: </b> {selectedVessel?.Destination}
      </ListGroupItem>
      <ListGroupItem>
        <b>ShipLength: </b> {selectedVessel?.ShipLength}
      </ListGroupItem>
      <ListGroupItem>
        <b>ShipWidth: </b> {selectedVessel?.ShipWidth}
      </ListGroupItem>
    </ListGroup>
    <div className="text-center">
      <Button
        className="mt-2 d-inline-flex align-items-center justify-content-center"
        color="primary"
        onClick={() => getVesselRoute(selectedVessel?.MMSI)}
        disabled={!selectedVessel?.MMSI || isLoading}
      >
        {isLoading && <Spinner size="sm" className="me-2" />}
        Xem hành trình
      </Button>
    </div>
  </div>
))

const ControlButton = memo(({ isPanelOpen, setIsPanelOpen }) => (
  <Button
    className="control-button"
    onClick={() => setIsPanelOpen(!isPanelOpen)}
    style={{
      right: isPanelOpen ? "calc(26% - 20px)" : "20px",
      transform: `translateY(-50%) rotate(${isPanelOpen ? "0deg" : "180deg"})`
    }}
    onMouseEnter={(e) => (e.currentTarget.style.background = "#0056b3")}
    onMouseLeave={(e) => (e.currentTarget.style.background = "#007bff")}
  >
    <span style={{ color: "white", fontSize: "20px", transform: "translateX(1px)" }}>➤</span>
  </Button>
))

const AISMap = () => {
  document.title = "Bản đồ tàu thuyền"

  const mapRef = useRef()
  const overlayRef = useRef()
  const mapInstance = useRef()
  const [vesselList, setVesselList] = useState([])
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [selectedVessel, setSelectedVessel] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const vectorSource = useMemo(() => new VectorSource(), [])

  const renderVessels = useCallback(
    (vessels) => {
      vectorSource
        .getFeatures()
        .filter((feature) => ["vessel", "path"].includes(feature.get("type")))
        .forEach((feature) => vectorSource.removeFeature(feature))

      vessels.forEach((vessel) => {
        vectorSource.addFeature(createVesselFeature(vessel))
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

  const getVesselList = useCallback(async () => {
    try {
      const response = await vesselService.getVesselList({})
      const vessels = response?.DM_Tau?.$values || []
      setVesselList(vessels)
      renderVessels(vessels)
    } catch (error) {
      console.error("Error fetching vessel list:", error)
      toast.error("Có lỗi xảy ra khi tải danh sách tàu")
    }
  }, [renderVessels])

  const getVesselRoute = async (MMSI) => {
    if (!MMSI) return

    try {
      setIsLoading(true)
      const response = await vesselService.getVesselRoute({ MMSI })
      const route = response?.DM_HanhTrinh?.$values || []
      renderPath(route)
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
      layers: [new TileLayer({ source: new OSM() }), new VectorLayer({ source: vectorSource })],
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
        setSelectedVessel(feature.get("data"))
        setIsPanelOpen(true)
      }
    })

    return () => {
      map.setTarget(undefined)
      overlayRef.current?.setPosition(undefined)
    }
  }, [vectorSource])

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Card>
            <CardBody style={{ position: "relative", height: "87vh", overflow: "hidden" }}>
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
              />
              <InfoPanel
                isPanelOpen={isPanelOpen}
                selectedVessel={selectedVessel}
                getVesselRoute={getVesselRoute}
                isLoading={isLoading}
              />
              <ControlButton isPanelOpen={isPanelOpen} setIsPanelOpen={setIsPanelOpen} />
            </CardBody>
          </Card>
        </Container>
      </div>
    </React.Fragment>
  )
}

export default AISMap
