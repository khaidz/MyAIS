import React, { useEffect, useRef, useState } from "react"
import { Container } from "reactstrap"
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
import vtTau1 from "./data/Tau1.json"
import vtTau2 from "./data/Tau2.json"
import vtTau3 from "./data/Tau3.json"

const INITIAL_CENTER = [107.5698, 16.4637]
const INITIAL_ZOOM = 6

const createVesselFeature = (vessel) => {
  const lastPoint = vessel.points[vessel.points.length - 1]
  const feature = new Feature({
    geometry: new Point(fromLonLat([lastPoint.longitude, lastPoint.latitude])),
    name: vessel.name,
    points: vessel.points,
    type: 'vessel'
  })

  feature.setStyle(new Style({
    image: new Icon({
      src: `src/assets/images/arrow/${vessel.color}.png`,
      scale: 0.4
    })
  }))

  return feature
}

const createPathFeatures = (points) => {
  if (!points) return []

  const lineFeature = new Feature({
    geometry: new LineString(points.map(point => fromLonLat([point.longitude, point.latitude]))),
    type: 'path'
  })

  lineFeature.setStyle(new Style({
    stroke: new Stroke({ color: "rgba(31, 124, 247, 0.7)", width: 2, lineDash: [10, 10] })
  }))

  const startFeature = new Feature({
    geometry: new Point(fromLonLat([points[0].longitude, points[0].latitude])),
    type: 'path'
  })

  startFeature.setStyle(new Style({
    image: new Icon({
      src: `src/assets/images/arrow/green.png`,
      scale: 0.4
    })
  }))

  return [lineFeature, startFeature]
}

const AISMap = () => {
  document.title = "Bản đồ tàu thuyền"

  const mapRef = useRef()
  const overlayRef = useRef()
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [vesselInfo, setVesselInfo] = useState("Chưa có thông tin tàu nào được chọn.")
  const [selectedVessel, setSelectedVessel] = useState(null)
  const vectorSource = useRef(new VectorSource()).current

  const renderVessels = (vesselList) => {
    vectorSource.getFeatures()
      .filter(feature => ['vessel', 'path'].includes(feature.get('type')))
      .forEach(feature => vectorSource.removeFeature(feature))

    vesselList.forEach(vessel => {
      vectorSource.addFeature(createVesselFeature(vessel))
    })
  }

  const renderPath = (points) => {
    vectorSource.getFeatures()
      .filter(feature => feature.get('type') === 'path')
      .forEach(feature => vectorSource.removeFeature(feature))

    createPathFeatures(points).forEach(feature => vectorSource.addFeature(feature))
  }

  useEffect(() => {
    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        new VectorLayer({ source: vectorSource })
      ],
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

    const vessels = [
      { name: "Tàu 1", color: "red", points: vtTau1 },
      { name: "Tàu 2", color: "blue", points: vtTau2 },
      { name: "Tàu 3", color: "yellow", points: vtTau3 }
    ]
    renderVessels(vessels)

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
      features.forEach(f => f.setStyle(style))
      vectorSource.addFeatures(features)
    }

    addFeatures(hoangSa, boundaryStyle)
    addFeatures(truongSa, boundaryStyle)
    addFeatures(offshore, offshoreStyle)

    map.on("singleclick", (event) => {
      const feature = map.forEachFeatureAtPixel(event.pixel, feat => feat)
      if (feature?.get('type') === 'vessel') {
        setVesselInfo(`
          <div><strong>Tên tàu :</strong> ${feature.get("name")}</div>
          <div><strong>Destination:</strong> <b>Hải Phòng</b></div>
          <div><strong>Position received:</strong> <b>1 hour ago</b></div>
        `)
        setIsPanelOpen(true)
        setSelectedVessel(feature.get("points"))
      } else {
        setVesselInfo("Chưa có thông tin tàu nào được chọn.")
        setSelectedVessel(null)
      }
    })

    return () => {
      map.setTarget(undefined)
      overlayRef.current.setPosition(undefined)
    }
  }, [])

  useEffect(() => {
    renderPath(selectedVessel)
  }, [selectedVessel])

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid style={{ position: "relative", height: "82vh", overflow: "hidden" }}>
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
          <InfoPanel isPanelOpen={isPanelOpen} vesselInfo={vesselInfo} />
          <ControlButton isPanelOpen={isPanelOpen} setIsPanelOpen={setIsPanelOpen} />
        </Container>
      </div>
    </React.Fragment>
  )
}

const InfoPanel = ({ isPanelOpen, vesselInfo }) => (
  <div
    id="infoPanel"
    style={{
      position: "absolute",
      right: isPanelOpen ? 0 : "-18%",
      top: 0,
      width: "18%",
      height: "100%",
      padding: "15px",
      backgroundColor: "rgba(249, 249, 249, 0.95)",
      boxShadow: "-2px 0 8px rgba(0, 0, 0, 0.1)",
      transition: "right 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      zIndex: 2,
      overflowY: "auto"
    }}
  >
    <h4
      style={{
        color: "#007bff",
        marginBottom: "15px",
        paddingBottom: "10px",
        borderBottom: "2px solid #007bff"
      }}
    >
      Thông tin tàu
    </h4>
    <div id="vesselInfo" dangerouslySetInnerHTML={{ __html: vesselInfo }} />
  </div>
)

const ControlButton = ({ isPanelOpen, setIsPanelOpen }) => (
  <button
    onClick={() => setIsPanelOpen(!isPanelOpen)}
    style={{
      position: "absolute", 
      top: "50%",
      right: isPanelOpen ? "calc(20% - 20px)" : "20px",
      transform: `translateY(-50%) rotate(${isPanelOpen ? "0deg" : "180deg"})`,
      background: "#007bff",
      border: "none",
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      cursor: "pointer",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      zIndex: 3,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}
    onMouseEnter={(e) => (e.currentTarget.style.background = "#0056b3")}
    onMouseLeave={(e) => (e.currentTarget.style.background = "#007bff")}
  >
    <span style={{ color: "white", fontSize: "20px", transform: "translateX(1px)" }}>➤</span>
  </button>
)

export default AISMap
