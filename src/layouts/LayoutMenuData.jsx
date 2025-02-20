import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

const Navdata = () => {
  const history = useNavigate()

  // Admin
  const [isUsers, setIsUsers] = useState(false)
  const [isMap, setIsMap] = useState(false)

  //state data
  const [iscurrentState, setIscurrentState] = useState("Users")

  function updateIconSidebar(e) {
    if (e && e.target && e.target.getAttribute("subitems")) {
      const ul = document.getElementById("two-column-menu")
      const iconItems = ul.querySelectorAll(".nav-icon.active")
      let activeIconItems = [...iconItems]
      activeIconItems.forEach((item) => {
        item.classList.remove("active")
        var id = item.getAttribute("subitems")
        if (document.getElementById(id)) document.getElementById(id).classList.remove("show")
      })
    }
  }

  useEffect(() => {
    document.body.classList.remove("twocolumn-panel")
    if (iscurrentState !== "Users") {
      setIsUsers(false)
    }
  }, [history, iscurrentState])

  const menuItems = [
    {
      label: "Admin",
      isHeader: true
    },
    {
      id: "users",
      label: "Quản lý người dùng",
      icon: "mdi mdi-speedometer",
      link: "/users",
      stateVariables: isUsers,
      click: function (e) {
        e.preventDefault()
        setIsUsers(!isUsers)
        setIscurrentState("Users")
      }
    },
    {
      id: "map",
      label: "Bản đồ tàu thuyền",
      icon: "mdi mdi-map-search",
      link: "/map",
      stateVariables: isMap,
      click: function (e) {
        e.preventDefault()
        setIsUsers(!isMap)
        setIscurrentState("Map")
      }
    }
  ]
  return <React.Fragment>{menuItems}</React.Fragment>
}
export default Navdata
