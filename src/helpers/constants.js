export const defaultSelectStyle = {
  multiValueLabel: (styles) => {
    return { ...styles, color: "white" };
  },
};

export const lovRole = [
  {label: 'user', value: 'USER'},
  {label: 'admin', value: 'ADMIN'},
]

export const vesselTypes = [
  {type: "1", name: 'CargoVessels'},
  {type: "2", name: 'Tankers'},
  {type: "3", name: 'PassengerVessels'},
  {type: "4", name: 'HighSpeedCraft'},
  {type: "5", name: 'TugsSpecialCraft'},
  {type: "6", name: 'Finshing'},
  {type: "7", name: 'PleasureCraft'},
  {type: "8", name: 'NavigationAids'},
  {type: "9", name: 'UnspecifiedShips'},
]
