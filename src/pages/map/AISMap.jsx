import Feature from "ol/Feature"
import Map from "ol/Map"
import Overlay from "ol/Overlay"
import View from "ol/View"
import { GeoJSON } from "ol/format"
import Point from "ol/geom/Point"
import TileLayer from "ol/layer/Tile"
import VectorLayer from "ol/layer/Vector"
import "ol/ol.css"
import { fromLonLat } from "ol/proj"
import OSM from "ol/source/OSM"
import VectorSource from "ol/source/Vector"
import { Fill, Icon, Stroke, Style, Text } from "ol/style"
import React, { useEffect, useRef, useState } from "react"
import { Button, Container } from "reactstrap"
import hoangSa from "./data/HoangSa.json"
import offshore from "./data/Offshore.json"
import vtTau1 from "./data/Tau1.json"
import vtTau2 from "./data/Tau2.json"
import vtTau3 from "./data/Tau3.json"
import truongSa from "./data/TruongSa.json"

const AISMap = () => {
  document.title = "Bản đồ tàu thuyền"

  const mapRef = useRef()
  const overlayRef = useRef()
  const [selectedVessel, setSelectedVessel] = useState(null)
  const [vesselPoints, setVesselPoints] = useState([])

  const vectorSource = new VectorSource()

  const vessels = [
    { name: "Tàu 1", color: "red", points: vtTau1 },
    { name: "Tàu 2", color: "blue", points: vtTau2 },
    { name: "Tàu 3", color: "yellow", points: vtTau3 }
  ]

  const renderVessels = (vesselList) => {
    vectorSource.clear()
    vesselList.forEach((vessel) => {
      vessel.points.forEach((point, index) => {
        if (index < vessel.points.length - 1) {
          const currentPoint = point
          const nextPoint = vessel.points[index + 1]
          const angleInRadians = Math.atan2(
            nextPoint.latitude - currentPoint.latitude,
            nextPoint.longitude - currentPoint.longitude
          )

          const feature = new Feature({
            geometry: new Point(fromLonLat([currentPoint.longitude, currentPoint.latitude])),
            name: vessel.name
          })

          const iconStyle = new Style({
            image: new Icon({
              src: `src/assets/images/arrow/${vessel.color}.png`,
              scale: 0.3,
              rotation: angleInRadians
            })
          })

          feature.setStyle(iconStyle)
          vectorSource.addFeature(feature)
        }
      })
    })
  }

  useEffect(() => {
    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM()
        }),
        new VectorLayer({
          source: vectorSource
        })
      ],
      view: new View({
        center: fromLonLat([107.5698, 16.4637]),
        zoom: 6
      })
    })

    const infoOverlay = new Overlay({
      element: document.getElementById("mapInfo"),
      positioning: "bottom-center",
      stopEvent: false
    })
    map.addOverlay(infoOverlay)
    overlayRef.current = infoOverlay

    const addFeaturesWithStyle = (features, style) => {
      features.forEach((feature) => {
        feature.setStyle(style)
        vectorSource.addFeature(feature)
      })
    }

    const addTextFeature = (coordinates, text) => {
      const textFeature = new Feature({
        geometry: new Point(fromLonLat(coordinates)),
        name: text
      })

      const textStyle = new Style({
        text: new Text({
          text: text,
          font: "bold 12px Arial",
          fill: new Fill({ color: "black" }),
          stroke: new Stroke({
            color: "white",
            width: 2
          })
        })
      })

      textFeature.setStyle(textStyle)
      vectorSource.addFeature(textFeature)
    }

    renderVessels(vessels)

    const polygonStyle = new Style({
      fill: new Fill({
        color: "rgba(87, 207, 243, 0.6)"
      }),
      stroke: new Stroke({
        color: "rgba(87, 207, 243, 0.7)",
        width: 2
      })
    })

    const geojsonFormat = new GeoJSON()

    const renderHoangSa = () => {
      const featuresHoangSa = geojsonFormat.readFeatures(hoangSa, {
        featureProjection: "EPSG:3857"
      })
      addFeaturesWithStyle(featuresHoangSa, polygonStyle)
      addTextFeature([111.67182892626687, 16.740999328151645], "QĐ. Hoàng Sa")
    }

    const renderTruongSa = () => {
      const featuresTruongSa = geojsonFormat.readFeatures(truongSa, {
        featureProjection: "EPSG:3857"
      })
      addFeaturesWithStyle(featuresTruongSa, polygonStyle)
      addTextFeature([113.81219385959923, 9.347000006457279], "QĐ. Trường Sa")
    }

    renderHoangSa()
    renderTruongSa()

    const featuresOffshore = geojsonFormat.readFeatures(offshore, {
      featureProjection: "EPSG:3857"
    })

    const lineStyle = new Style({
      stroke: new Stroke({
        color: "rgba(31, 124, 247, 0.7)",
        width: 2
      })
    })

    addFeaturesWithStyle(featuresOffshore, lineStyle)

    map.on("pointermove", (event) => {
      const feature = map.forEachFeatureAtPixel(event.pixel, (feat) => feat)
      const mapInfoElement = document.getElementById("mapInfo")

      if (feature && mapInfoElement) {
        const coordinates = feature.getGeometry().getCoordinates()
        overlayRef.current.setPosition(coordinates)
        mapInfoElement.innerHTML = `<div><div class="fw-bold">${feature.get("name")}</div><div>Destination: <b>Hải Phòng</b></div><div>Position received: <b>1 hour ago</b></div></div>`
        mapInfoElement.style.display = "block"
      } else if (mapInfoElement) {
        overlayRef.current.setPosition(undefined)
        mapInfoElement.style.display = "none"
      }
    })

    map.on("click", (event) => {
      const feature = map.forEachFeatureAtPixel(event.pixel, (feat) => feat)
      if (feature) {
        const vesselName = feature.get("name")
        const selectedVessel = vessels.find((v) => v.name === vesselName)
        setSelectedVessel(selectedVessel)
        setVesselPoints(selectedVessel.points)
        renderVessels([selectedVessel])
      }
    })

    return () => {
      map.setTarget(undefined)
      overlayRef.current.setPosition(undefined)
    }
  }, [])

  const handleCloseSidebar = () => {
    setSelectedVessel(null)
    setVesselPoints([])
    renderVessels(vessels)
  }

  return (
    <React.Fragment>
      <div className="page-content">
        <div id="mapInfo" />
        <Container fluid>
          <div ref={mapRef} style={{ width: "100%", height: "82vh" }} />
        </Container>
        {selectedVessel && (
          <div className="right-sidebar">
            <Button onClick={handleCloseSidebar}>Close</Button>
            <h4>{selectedVessel.name}</h4>
            <ul>
              {vesselPoints.map((point, index) => (
                <li key={index}>
                  Lat: {point.latitude}, Lon: {point.longitude}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </React.Fragment>
  )
}
export default AISMap
