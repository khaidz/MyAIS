import React from 'react';
import AppRoutes from './routes/AppRoutes';
import { loadAnimation } from "lottie-web";
import { defineElement } from "lord-icon-element";

// register lottie and define custom element
defineElement(loadAnimation);

function App(props) {
  return <AppRoutes />;
}

export default App;
