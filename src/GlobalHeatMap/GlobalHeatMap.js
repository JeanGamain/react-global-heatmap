import React from 'react';

import styles from './GlobalHeatMap.css';

const fusionTableId = "1tjlAicmzLGDeu_elc_uxZGCzFf-Q4ZnFo2hIeD1O";
const apiKey = "AIzaSyDIH3xdVpwSky4ENMYkaUG2jhH7N5ep1B4";

class GlobalHeatMap extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      country: [],
      canRefresh: true,
      dateRangeControlEnable: true,
      dateRangeStart: '2000 Nov 1',
      dateRangeStop: '2013 Aug 1',
    };

    this.getSqlCountrySelector = this.getSqlCountrySelector.bind(this);
    this.getSqlDateRange = this.getSqlDateRange.bind(this);
    this.refreshData = this.refreshData.bind(this);
    this.initializeMap = this.initializeMap.bind(this);
    this.refreshMap = this.refreshMap.bind(this);
    this.getData = this.getData.bind(this);
    //this. = this..bind(this);

    //this. = this..bind(this);
  }

  componentDidMount() {
    // initialize google chart
    google.maps.event.addDomListener(window, 'load', this.initializeMap);
    google.charts.load('current', {packages:['corechart', 'table', 'gauge', 'controls', 'line']});

    google.charts.setOnLoadCallback(function () {
      // query all country
      getData('SELECT Country FROM ' + fusionTableId + ' GROUP BY Country', function (response) {
        this.state.country = response.rows;
        this.setState(this.state);
      });
      refreshData();
    });
  }

  initializeMap() {
    google.maps.visualRefresh = true;
    this.refreshMap();
  }

  getData(query, handler) {
    return $.get(
      encodeURI('https://www.googleapis.com/fusiontables/v2/query?sql=' + query + '&key=' + apiKey),
      handler,
      'jsonp'
    );
  }

  handleData(response){

  }

  refreshMap() {
    var dateRange = getSqlDateRange();
    var countryFilter = getSqlCountrySelector();
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

  getSqlDateRange() {
    if (this.state.dateRangeControlEnable)
      return '';
    return (
      "col0\x3e\x3e0 \x3e\x3d '" + moment(this.state.dateRangeStart).format('YYYY MMM D') + '\' AND ' +
      "col0\x3e\x3e0 \x3c\x3d '" + moment(this.state.dateRangeStop).format('YYYY MMM D') + '\''
    );
  }

  getSqlCountrySelector() {
    return (
      ' Country IN (' +
      this.state.country.map((country, i) => (
        "'" + country + "'" + (i + 1 === this.state.country.length) ? '' : ', '
      )) + ') '
    );
  }

  refreshData() {
    this.state.canRefresh = false;
    this.setState(this.state);
    const dateRange = this.getSqlDateRange();
    const countryFilter = this.getSqlCountrySelector();
    var where = dateRange + ((countryFilter) ? ((dateRange) ? ' AND ' : '') + countryFilter : '');
    var sqlQuery;
    if (countryFilter === '')
      sqlQuery = 'SELECT dt as col0, COUNT() as rowCount, SUM(AverageTemperature) as temperature FROM ' + fusionTableId + ((dateRange != '') ? ' WHERE ' + dateRange : '') + ' GROUP BY dt ORDER BY dt DESC LIMIT 800';
    else
      sqlQuery = 'SELECT dt as col0, AverageTemperature as temperature, Country FROM ' + fusionTableId + ((where != '') ? ' WHERE ' + where : '') + ' ORDER BY dt DESC LIMIT 800';

    this.getData(sqlQuery, dataHandler);
    this.refreshMap();
  }

  render() {

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
        <span className="googft-legend-swatch" style={Object.assign({}, styles.legendSwatch, {backgroundColor: range.color})}/>
        <span className="googft-legend-range" style={styles.legendRange}>{range.min} to {range.max}</span>
      </div>
    ));

    const countryOption = this.state.country.map(country => (
      <option value={country}>{country}</option>
    ));

    return (
      <div style={styles.section}>

        <h1>Global Temperatures by country from 1743 to 2013.</h1>
        <div>
          <div id="googft-mapCanvas" style={styles.mapCanvas} />
          <input id="googft-legend-open" style={{display: 'none'}} type="button" value="Legend" />
          <div id="googft-legend">
            <p id="googft-legend-title">AverageTemperature</p>
            <div>
              { tempetureRange }
            </div>
            <input id="googft-legend-close" style={{display: 'none'}} type="button" value="Hide" />
          </div>
        </div>

        <div style={styles.controls}>
          <span id="dateRangeLabel">
            From: <input id="dateRangeStart" style={styles.dateRange} type="text" value={this.state.dateRangeStart}/>
            to <input style={styles.dateRange} id="dateRangeEnd" type="text" value={this.state.dateRangeStop}/>
          </span><br />
          <label for="countrySelector">
            Country:
          </label>
          <select id="countrySelector" onChange="changeCountrySelector(this)">
            <option value=""></option>
            {countryOption}
          </select>>
          <div id="countrySelected" style={styles.countrySelected}/>
          <br />
          <input id="refreshButton" type="button" onClick="refreshData()" value="Refresh" disabled={this.state.canRefresh}/>
        </div>

        <div style={styles.dashboard}>
          <table className="columns">
            <tr>
              <td>
                <div style={styles.chart}></div>
              </td>
            </tr>
            <tr>
              <td>
                <div style={styles.controls}></div>
              </td>
            </tr>
          </table>
        </div>


      </div>
    );
  }
}



GlobalHeatMap.propTypes = {
  r: React.PropTypes.bool.isRequired,
};

export default GlobalHeatMap;
