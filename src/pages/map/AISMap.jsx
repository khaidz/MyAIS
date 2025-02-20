import Feature from "ol/Feature"
import Map from "ol/Map"
import Overlay from "ol/Overlay"
import View from "ol/View"
import Point from "ol/geom/Point"
import TileLayer from "ol/layer/Tile"
import VectorLayer from "ol/layer/Vector"
import "ol/ol.css"
import { fromLonLat } from "ol/proj"
import OSM from "ol/source/OSM"
import VectorSource from "ol/source/Vector"
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from "ol/style"
import React, { useEffect, useRef } from "react"
import { Container } from "reactstrap"
import BreadCrumb from "../../components/BreadCrumb"
import hoangSa from "./data/HoangSa.json"
import truongSa from "./data/TruongSa.json"
import offshore from "./data/Offshore.json"
import { GeoJSON } from "ol/format"
import vtTau1 from "./data/Tau1.json"
import vtTau2 from "./data/Tau2.json"
import vtTau3 from "./data/Tau3.json"

const AISMap = () => {
  document.title = "Bản đồ tàu thuyền"

  const mapRef = useRef()
  const overlayRef = useRef()

  useEffect(() => {
    const vectorSource = new VectorSource()
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

    // Định nghĩa 3 tàu với tọa độ, màu sắc và lịch trình di chuyển
    const vessels = [
      { name: "Tàu 1", color: "red", points: vtTau1 },
      { name: "Tàu 2", color: "blue", points: vtTau2 },
      { name: "Tàu 3", color: "yellow", points: vtTau3 }
    ]

    // Tạo các điểm cho mỗi tàu
    vessels.forEach((vessel) => {
      vessel.points.forEach((point) => {
        const feature = new Feature({
          geometry: new Point(fromLonLat([point.longitude, point.latitude])),
          name: vessel.name
        })

        feature.setStyle(
          new Style({
            image: new CircleStyle({
              radius: 3,
              fill: new Fill({ color: vessel.color }),
              stroke: new Stroke({ color: "black", width: 0.3 })
            })
          })
        )

        vectorSource.addFeature(feature)
      })
    })

    // Đánh dấu Hoàng Sa, Trường Sa
    //// Thiết lập kiểu cho polygon
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
    const featuresHoangSa = geojsonFormat.readFeatures(hoangSa, {
      featureProjection: "EPSG:3857"
    })
    vectorSource.addFeatures(featuresHoangSa)

    // Áp dụng kiểu cho các feature
    featuresHoangSa.forEach((feature) => {
      feature.setStyle(polygonStyle)
    })

    const featuresTruongSa = geojsonFormat.readFeatures(truongSa, {
      featureProjection: "EPSG:3857"
    })
    vectorSource.addFeatures(featuresTruongSa)

    // Áp dụng kiểu cho các feature
    featuresTruongSa.forEach((feature) => {
      feature.setStyle(polygonStyle)
    })

    // Thêm text cho Hoàng Sa
    const textFeatureHoangSa = new Feature({
      geometry: new Point(fromLonLat([111.67182892626687, 16.740999328151645])), // Tọa độ trung tâm Hoàng Sa
      name: "QĐ. Hoàng Sa"
    })

    const textStyle = new Style({
      text: new Text({
        text: "QĐ. Hoàng Sa",
        font: "bold 12px Arial",
        fill: new Fill({ color: "black" }),
        stroke: new Stroke({
          color: "white",
          width: 2
        })
      })
    })

    textFeatureHoangSa.setStyle(textStyle)
    vectorSource.addFeature(textFeatureHoangSa)

    // Thêm text cho Trường Sa
    const textFeatureTruongSa = new Feature({
      geometry: new Point(fromLonLat([113.81219385959923, 9.347000006457279])), // Tọa độ trung tâm Hoàng Sa
      name: "QĐ. Hoàng Sa"
    })

    const textStyle2 = new Style({
      text: new Text({
        text: "QĐ. Trường Sa",
        font: "bold 12px Arial",
        fill: new Fill({ color: "black" }),
        stroke: new Stroke({
          color: "white",
          width: 2
        })
      })
    })

    textFeatureTruongSa.setStyle(textStyle2)
    vectorSource.addFeature(textFeatureTruongSa)

    // Thêm dữ liệu GeoJSON cho đường đi vào bản đồ
    const featuresOffshore = geojsonFormat.readFeatures(offshore, {
      featureProjection: "EPSG:3857"
    })
    vectorSource.addFeatures(featuresOffshore)

    // Thiết lập kiểu cho đường đi
    const lineStyle = new Style({
      stroke: new Stroke({
        color: "rgba(31, 124, 247, 0.7)", // Màu đường
        width: 2 // Độ dày của đường
      })
    })

    // Áp dụng kiểu cho từng feature của đường đi
    featuresOffshore.forEach((feature) => {
      feature.setStyle(lineStyle)
    })

    // Thêm sự kiện hover cho overlay
    map.on("pointermove", (event) => {
      const feature = map.forEachFeatureAtPixel(event.pixel, (feat) => feat)
      if (feature) {
        const coordinates = feature.getGeometry().getCoordinates()
        overlayRef.current.setPosition(coordinates)
        document.getElementById("mapInfo").innerHTML =
          `<div><div class="fw-bold">${feature.get("name")}</div><div>Destination: <b>Hải Phòng</b></div><div>Position received: <b>1 hour ago</b></div></div>`
        document.getElementById("mapInfo").style.display = "block"
      } else {
        overlayRef.current.setPosition(undefined)
        document.getElementById("mapInfo").style.display = "none"
      }
    })

    return () => {
      map.setTarget(undefined)
      overlayRef.current.setPosition(undefined)
    }
  }, [])

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <div ref={mapRef} style={{ width: "100%", height: "82vh" }} />
        </Container>
      </div>
    </React.Fragment>
  )
}
export default AISMap
