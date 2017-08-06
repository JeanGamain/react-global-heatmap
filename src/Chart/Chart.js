import React from 'react';

import styles from './Chart.css';

const Chart = () => {

  return (
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
  );
}

export default Chart;
