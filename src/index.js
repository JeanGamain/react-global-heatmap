import React from 'react';
import ReactDOM from 'react-dom';
import GlobalHeatMap from './GlobalHeatMap/GlobalHeatMap.js';

const fusionTableId = "1tjlAicmzLGDeu_elc_uxZGCzFf-Q4ZnFo2hIeD1O";
const apiKey = "AIzaSyDIH3xdVpwSky4ENMYkaUG2jhH7N5ep1B4";

ReactDOM.render(
  <GlobalHeatMap/>,
  document.getElementById('app')
);

module.hot.accept();
