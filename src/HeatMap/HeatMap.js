import React from 'react';

import styles from './HeatMap.css';

const HeatMap = () => {
  const tempetureRangeConfig = [
    { min: -37.658, max: -8, color: "#eeeeee"},
    { min: -8, max: 2, color: "#9fc5e8"},
    { min: 2, max: 9.6, color: "#3d85c6"},
    { min: 9.6, max: 18, color: "#0b5394"},
    { min: 18, max: 23.4, color: "#b6d7a8"},
    { min: 23.4, max: 26.4, color: "#38761d"},
    { min: 26.4, max: 32, color: "#ff9900"},
    { min: 32, max: 70, color: "#ff0000"}
  ];

  const tempetureRange = tempetureRangeConfig.map(range => (
      <div>
        <span style={Object.assign({}, styles.legendSwatch, {backgroundColor: range.color})}/>
        <span style={styles.legendRange}>{range.min} to {range.max}</span>
      </div>
    ));

  function initializeMap() {
    google.maps.visualRefresh = true;
    refreshMap();
  }

  function refreshMap() {
    var dateRange = getDateRange();
    var countryFilter = getCountrySelector();
    var mapDiv = document.getElementById('googft-mapCanvas');

    map = new google.maps.Map(mapDiv, {
      center: new google.maps.LatLng(48.866667, 2.333333),
      zoom: 5,
      streetViewControl: false,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    });

    layer = new google.maps.FusionTablesLayer({
      map: map,
      heatmap: { enabled: false },
      query: {
        select: "col0\x3e\x3e1, Country, SUM(AverageTemperature)",
        from: fusionTableId,
        where: ((dateRange) ? dateRange : "col0\x3e\x3e0 \x3e\x3d \x272000 Nov 1\x27 and col0\x3e\x3e0 \x3c\x3d \x272013 Aug 1\x27") + ((countryFilter) ? ' AND ' + countryFilter : ''),
      },
      options: {
        styleId: 2,
        templateId: 2
      }
    });
  }

  google.maps.event.addDomListener(window, 'load', initializeMap);

  return (
    <div>
      <div id="googft-mapCanvas" style={styles.mapCanvas} />
      <input id="googft-legend-open" style={{display: 'none'}} type="button" value="Legend" />
      <div id="googft-legend">
        <p id="googft-legend-title">AverageTemperature</p>
        <div>
          { tempetureRange }
        </div>
        <div>
          <input id="googft-legend-close" style={{display: 'none'}} type="button" value="Hide" />
        </div>
      </div>
    </div>
  );
}

export default HeatMap;
