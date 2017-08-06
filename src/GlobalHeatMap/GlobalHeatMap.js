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
      dateRangeControl: false,
      dateRangeStart: '2000 Nov 1',
      dateRangeStop: '2013 Aug 1',
    };

    this.getSqlCountrySelector = this.getSqlCountrySelector.bind(this);
    this.getSqlDateRange = this.getSqlDateRange.bind(this);
    this.refreshData = this.refreshData.bind(this);
    this.initializeMap = this.initializeMap.bind(this);
    this.refreshMap = this.refreshMap.bind(this);
    this.getData = this.getData.bind(this);
    this.handleData = this.handleData.bind(this);
    this.selectCountry = this.selectCountry.bind(this);
    this.unselectCountry = this.unselectCountry.bind(this);
    this.changeRangeStart = this.changeRangeStart.bind(this);
    this.changeRangeStop = this.changeRangeStop.bind(this);
  }

  componentDidMount() {
    // initialize google chart
    google.maps.event.addDomListener(window, 'load', this.initializeMap);
    google.charts.load('current', {packages:['corechart', 'table', 'gauge', 'controls', 'line']});

    let my = this;
    google.charts.setOnLoadCallback(function () {
      // query all country
      my.getData('SELECT Country FROM ' + fusionTableId + ' GROUP BY Country', function (response) {
        my.state.country = response.rows.map((country) => ({ name: country[0], selected: false }));
        my.setState(my.state);
      });
      my.refreshData();
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
    let dashboard = new google.visualization.Dashboard(
      document.getElementById('chartRangeFilter_dashboard')
    );

    this.state.dateRangeControl = new google.visualization.ControlWrapper({
      'controlType': 'ChartRangeFilter',
      'containerId': 'chartRangeFilter_control',
      'options': {
        // Filter by the date axis.
        'filterColumnIndex': 0,
        'ui': {
          'chartType': 'LineChart',
          'chartOptions': {
            'chartArea': {'width': '90%'},

          },
          // 1 month in milliseconds = 24 * 60 * 60 * 1000 = 2 628 002 880
        }
      },
      // Initial range
      'state': {'range': {'start': new Date(1743, 1, 1), 'end': new Date(2013, 1, 1)}}
    });
    this.setState(this.state);

    let chart = new google.visualization.ChartWrapper({
      'chartType': 'LineChart',
      'containerId': 'chartRangeFilter_chart',
      'options': {
        // Use the same chart area width as the control for axis alignment.
        'legend': {position: 'none'},
        'chartArea': {'height': '80%', 'width': '90%'},
        'hAxis': {'slantedText': true},
        'vAxis': {'viewWindow': {'min': -5, 'max': 35}},
      },
      colors: ['#a52714', '#097138'],
    });

    let data = new google.visualization.DataTable();
    data.addColumn('date', 'Date');
    let c = 0;
    let selectedCountry = [];
    this.state.country.map((country) => {
      if (country.selected) {
        c++;
        selectedCountry.push(country);
        data.addColumn('number', country.name + ' temperature');
      }
    });

    if (c === 0)
      data.addColumn('number', 'Temperature');

    let cleanRows = [];
    for (let i = 0; i < response.rows.length ; ++i) {
      if (c === 0) {
        response.rows[i][1] = Number(response.rows[i][1]);
        response.rows[i][2] /= response.rows[i][1];
        cleanRows.push([
          new Date(response.rows[i][0]),
          response.rows[i][2]
        ]);
      } else {
        let row = [
          new Date(response.rows[i][0])
        ];
        let j = i;
        for (let k = 0; k < selectedCountry.length; ++k) {
          for (i = j; i < response.rows.length && response.rows[j][0] === response.rows[i][0] && response.rows[i][2] !== selectedCountry[k].name; ++i);
          if (i < response.rows.length && response.rows[i][2] === selectedCountry[k].name && response.rows[j][0] === response.rows[i][0])
            row.push((response.rows[i][1] === "NaN") ? undefined : response.rows[i][1]);
          else
            row.push(undefined);
        }
        cleanRows.push(row);
      }
    }
    // point predict
    if (c != 0) {
      for (let i = 0; i < cleanRows.length; ++i) {
        for (let j = 1; j < cleanRows[i].length; ++j) {
          if (cleanRows[i][j] === undefined) {
            let k = i + 1;
            for (; k < selectedCountry.length && cleanRows[k][j] === undefined; ++k);
            if (k < cleanRows.length) {
              if (i !== 0) {
                let diffDayStart = moment(cleanRows[i][0]).diff(moment(cleanRows[i - 1][0]), 'days') * -1;
                let diffDayEnd = moment(cleanRows[i][0]).diff(moment(cleanRows[k][0]), 'days');
                cleanRows[i][j] = (cleanRows[i - 1][j] * diffDayStart + cleanRows[k][j] * diffDayEnd) / (diffDayStart + diffDayEnd);
              }
            }
          }
        }
      }
    }

    data.addRows(cleanRows);

    dashboard.bind(this.state.dateRangeControl, chart);
    dashboard.draw(data);
    let my = this;
    google.visualization.events.addListener(this.state.dateRangeControl, 'statechange', function (e){
      let start = moment(my.state.dateRangeControl.getState().range.start);
      let end = moment(my.state.dateRangeControl.getState().range.end);
      my.state.dateRangeStart = start.format('YYYY MMM D');
      my.state.dateRangeStop = end.format('YYYY MMM D');
      my.setState(my.state);
    });
    this.state.canRefresh = true;
    this.setState(this.state);
  }

  refreshMap() {
    let dateRange = this.getSqlDateRange();
    let countryFilter = this.getSqlCountrySelector();
    let mapDiv = document.getElementById('googft-mapCanvas');

    let map = new google.maps.Map(mapDiv, {
      center: new google.maps.LatLng(48.866667, 2.333333),
      zoom: 5,
      streetViewControl: false,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    });

    let layer = new google.maps.FusionTablesLayer({
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
    if (this.state.dateRangeControl === false)
      return '';
    return (
      "col0\x3e\x3e0 \x3e\x3d '" + moment(this.state.dateRangeStart).format('YYYY MMM D') + '\' AND ' +
      "col0\x3e\x3e0 \x3c\x3d '" + moment(this.state.dateRangeStop).format('YYYY MMM D') + '\''
    );
  }

  getSqlCountrySelector() {
    let s = [];
    this.state.country.map(country => {
      if (country.selected) {
        s.push("'" + country.name.replace("'","") + "'");
      }
    });
    return (s.length === 0) ?  '' : ' Country IN (' + s.join(',') + ') ';
  }

  refreshData() {
    this.state.canRefresh = false;
    this.setState(this.state);
    const dateRange = this.getSqlDateRange();
    const countryFilter = this.getSqlCountrySelector();
    let where = dateRange + ((countryFilter) ? ((dateRange) ? ' AND ' : '') + countryFilter : '');
    let sqlQuery;
    if (countryFilter === '')
      sqlQuery = 'SELECT dt as col0, COUNT() as rowCount, SUM(AverageTemperature) as temperature FROM ' + fusionTableId + ((dateRange != '') ? ' WHERE ' + dateRange : '') + ' GROUP BY dt ORDER BY dt DESC LIMIT 800';
    else
      sqlQuery = 'SELECT dt as col0, AverageTemperature as temperature, Country FROM ' + fusionTableId + ((where != '') ? ' WHERE ' + where : '') + ' ORDER BY dt DESC LIMIT 800';

    this.getData(sqlQuery, this.handleData);
    this.refreshMap();
  }

  selectCountry(e) {
    this.state.country[e.target.value].selected = true;
    this.setState(this.state);
  }

  unselectCountry(i) {
    this.state.country[i].selected = false;
    this.setState(this.state);
  }

  changeRangeStart(e) {
    this.state.dateRangeStart = e.target.value;
    this.setState(this.state);
  }

  changeRangeStop(e) {
    this.state.dateRangeStop = e.target.value;
    this.setState(this.state);
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
        <span className={styles.legendSwatch} style={{backgroundColor: range.color}}/>
        <span className={styles.legendRange}>{range.min} to {range.max}</span>
      </div>
    ));

    const countryOption = this.state.country.map((country, i) => ((country.selected == false) ?
        <option value={i}>{country.name}</option>
        : ''
    ));

    const selectedCountry =  this.state.country.map((country, i) => ((country.selected) ?
        <span className={styles.countryTags}>
          {country.name}
          <span className={styles.countryTagsRemove} onClick={() => {this.unselectCountry(i)}}>x</span>
        </span>
      : ''
    ));

    return (
      <div className={styles.section}>
        <h1>Global Temperatures by country from 1743 to 2013.</h1>
        <div id="googft-mapCanvas" className={styles.mapCanvas} />
        <input id="googft-legend-open" style={{display: 'none'}} type="button" value="Legend" />
        <div id="googft-legend" className={styles.googftLegend}>
          <p id="googft-legend-title">Temperature range:</p>
          <div>
            { tempetureRange }
          </div>
          <input id="googft-legend-close" style={{display: 'none'}} type="button" value="Hide" />
        </div>

        <div className={styles.controls}>
          <span id="dateRangeLabel">
            From: <input id="dateRangeStart" className={styles.dateRange} type="text" value={this.state.dateRangeStart} onChange={this.changeRangeStart}/>
            {' '}to <input className={styles.dateRange} id="dateRangeEnd" type="text" value={this.state.dateRangeStop} onChange={this.changeRangeStop}/>
          </span><br />
          <label for="countrySelector">
            Country:{' '}
          </label>
          <select id="countrySelector" onChange={this.selectCountry} >
            <option value=""/>
            {countryOption}
          </select>
          <div id="countrySelected" className={styles.countrySelected}>
            {selectedCountry}
          </div>
          <br />
          <input id="refreshButton" type="button" onClick={this.refreshData} value="Refresh" disabled={!this.state.canRefresh}/>
        </div>

        <div id="chartRangeFilter_dashboard" className={styles.dashboard}>
          <table className="columns">
            <tr>
              <td>
                <div id="chartRangeFilter_chart" className={styles.chart}/>
              </td>
            </tr>
            <tr>
              <td>
                <div id="chartRangeFilter_control" className={styles.controlSection}/>
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
