import React, { useEffect, useRef, useState } from "react"
import { Button, Col, Container, ListGroup, ListGroupItem, Row } from "reactstrap"
import Feature from "ol/Feature"
import Map from "ol/Map"
import Overlay from "ol/Overlay"
import View from "ol/View"
import Point from "ol/geom/Point"
import LineString from "ol/geom/LineString"
import TileLayer from "ol/layer/Tile"
import VectorLayer from "ol/layer/Vector"
import "ol/ol.css"
import { fromLonLat } from "ol/proj"
import OSM from "ol/source/OSM"
import VectorSource from "ol/source/Vector"
import { Fill, Icon, Stroke, Style } from "ol/style"
import { GeoJSON } from "ol/format"
import hoangSa from "./data/HoangSa.json"
import truongSa from "./data/TruongSa.json"
import offshore from "./data/Offshore.json"

import { vesselTypes } from "../../helpers/constants"
import { vesselService } from "../../services/vessel-service"

const INITIAL_CENTER = [107.5698, 16.4637]
const INITIAL_ZOOM = 6

const createVesselFeature = (vessel) => {
  const lastPoint = vessel.points[vessel.points.length - 1]
  const feature = new Feature({
    geometry: new Point(fromLonLat([lastPoint.longitude, lastPoint.latitude])),
    points: vessel.points,
    type: "vessel",
    data: vessel
  })
  const vesselType = vesselTypes.find((type) => type.type === vessel.vesselType)
  feature.setStyle(
    new Style({
      image: new Icon({
        src: `src/assets/images/vessel/${vesselType.name}.png`,
        scale: 0.8
      })
    })
  )

  return feature
}

const createPathFeatures = (points) => {
  if (!points) return []

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

const AISMap = () => {
  document.title = "Bản đồ tàu thuyền"

  const mapRef = useRef()
  const overlayRef = useRef()
  const [vesselList, setVesselList] = useState([])

  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [selectedVessel, setSelectedVessel] = useState(null)
  const vectorSource = useRef(new VectorSource()).current

  const renderVessels = (vesselList) => {
    vectorSource
      .getFeatures()
      .filter((feature) => ["vessel", "path"].includes(feature.get("type")))
      .forEach((feature) => vectorSource.removeFeature(feature))

    vesselList.forEach((vessel) => {
      vectorSource.addFeature(createVesselFeature(vessel))
    })
  }

  const renderPath = (points) => {
    vectorSource
      .getFeatures()
      .filter((feature) => feature.get("type") === "path")
      .forEach((feature) => vectorSource.removeFeature(feature))

    createPathFeatures(points).forEach((feature) => vectorSource.addFeature(feature))
  }

  useEffect(() => {
    vesselService.getVesselList().then((vessels) => {
      setVesselList(vessels)
      renderVessels(vessels)
    })

    const map = new Map({
      target: mapRef.current,
      layers: [new TileLayer({ source: new OSM() }), new VectorLayer({ source: vectorSource })],
      view: new View({
        center: fromLonLat(INITIAL_CENTER),
        zoom: INITIAL_ZOOM
      })
    })

    const infoOverlay = new Overlay({
      element: document.getElementById("mapInfo"),
      positioning: "bottom-center",
      stopEvent: false
    })
    map.addOverlay(infoOverlay)
    overlayRef.current = infoOverlay

    const geojsonFormat = new GeoJSON()
    const boundaryStyle = new Style({
      fill: new Fill({ color: "rgba(87, 207, 243, 0.6)" }),
      stroke: new Stroke({ color: "rgba(87, 207, 243, 0.7)", width: 2 })
    })

    const offshoreStyle = new Style({
      stroke: new Stroke({ color: "rgba(31, 124, 247, 0.7)", width: 2 })
    })

    const addFeatures = (data, style) => {
      const features = geojsonFormat.readFeatures(data, { featureProjection: "EPSG:3857" })
      features.forEach((f) => f.setStyle(style))
      vectorSource.addFeatures(features)
    }

    addFeatures(hoangSa, boundaryStyle)
    addFeatures(truongSa, boundaryStyle)
    addFeatures(offshore, offshoreStyle)

    map.on("singleclick", (event) => {
      const feature = map.forEachFeatureAtPixel(event.pixel, (feat) => feat)
      console.log(feature)
      if (feature?.get("type") === "vessel") {
        setSelectedVessel(feature.get("data"))
        setIsPanelOpen(true)
      }
    })

    return () => {
      map.setTarget(undefined)
      overlayRef.current.setPosition(undefined)
    }
  }, [])

  useEffect(() => {
    renderPath(selectedVessel?.points)
  }, [selectedVessel])

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid style={{ position: "relative", height: "87vh", overflow: "hidden" }}>
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
          <InfoPanel isPanelOpen={isPanelOpen} selectedVessel={selectedVessel} />
          <ControlButton isPanelOpen={isPanelOpen} setIsPanelOpen={setIsPanelOpen} />
        </Container>
      </div>
    </React.Fragment>
  )
}

const InfoPanel = ({ isPanelOpen, selectedVessel }) => (
  console.log(selectedVessel),
  (
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
          <b>Name: </b> {selectedVessel?.vesselName}
        </ListGroupItem>
        <ListGroupItem>
          <b>MMSI: </b> {selectedVessel?.mmsi}
        </ListGroupItem>
        <ListGroupItem>
          <b>IMO: </b> {selectedVessel?.imo}
        </ListGroupItem>
        <ListGroupItem>
          <b>Call sign: </b> {selectedVessel?.callSign}
        </ListGroupItem>
        <ListGroupItem>
          <b>AIS transponder class: </b> {selectedVessel?.clazz}
        </ListGroupItem>
        <ListGroupItem>
          <b>General vessel type: </b> {selectedVessel?.vesselType}
        </ListGroupItem>
        <ListGroupItem>
          <b>Position received: </b> {selectedVessel?.received}
        </ListGroupItem>
        <ListGroupItem>
          <b>Latitude/Longitude: </b> {selectedVessel?.points[selectedVessel?.points.length - 1].latitude}
          / {selectedVessel?.points[selectedVessel?.points.length - 1].longitude}
        </ListGroupItem>
        <ListGroupItem>
          <b>Speed: </b> {selectedVessel?.speed}
        </ListGroupItem>
        <ListGroupItem>
          <b>Course: </b> {selectedVessel?.course}
        </ListGroupItem>
      </ListGroup>
    </div>
  )
)

const ControlButton = ({ isPanelOpen, setIsPanelOpen }) => (
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
)

export default AISMap
