import React from 'react';

import styles from './Controls.css';

const Controls = () => {

  return (
    <div style={styles.controls}>
      <span id="dateRangeLabel">
        From: <input id="dateRangeStart" style={styles.dateRange} type="text" value="2000 Nov 1"/> to <input style={styles.dateRange} id="dateRangeEnd" type="text" value="2013 Aug 1"/>
      </span><br />
      <label for="countrySelector">
        Country:
      </label>
      <select id="countrySelector" onChange="changeCountrySelector(this)" />
      <div id="countrySelected" style={styles.countrySelected}/>
      <br />
      <input id="refreshButton" type="button" onClick="refreshData()" value="Refresh"/>
    </div>
  );
}

export default Controls;
