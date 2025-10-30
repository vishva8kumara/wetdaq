google.charts.load('current', {'packages':['gauge', 'corechart']});
google.charts.setOnLoadCallback(startMonitoring);

let tempGauge, pressureGauge, humidityGauge, lineChart1, lineChart2, lineChart3, windScatter;
let tempGaugeData, pressureGaugeData, humidityGaugeData;
let csvString = '';

let tempGaugeOptions = { min: 18, max: 72, redFrom: 55, yellowFrom: 45, minorTicks: 5, fontName: 'Rubik' };
let pressureGaugeOptions = { min: 50, max: 150, redFrom: 180, yellowFrom: 160, minorTicks: 5, fontName: 'Rubik' };
let humidityGaugeOptions = { min: 10, max: 80, redFrom: 75, yellowFrom: 70, minorTicks: 5, fontName: 'Rubik' };

let lastStartTime = null;
let lastEndTime = null;

function drawCharts(metrics) {
  const data = metrics.data;
  if (!data || data.length === 0) return;

  const firstEnd = data[0].endtime;
  const lastEnd = data[data.length - 1].endtime;

  // Always re-render gauges for real-time values
  const temperature = metrics.recent ? 1.0 * metrics.recent.temp : data[0].temp;
  const pressure = metrics.recent ? 0.1 * metrics.recent.prs : data[0].pres / 10;
  const humidity = metrics.recent ? 1.0 * metrics.recent.hum : data[0].humd;

  tempGaugeData = google.visualization.arrayToDataTable([['Label', 'Value'], ['Temperature', temperature]]);
  pressureGaugeData = google.visualization.arrayToDataTable([['Label', 'Value'], ['Pressure', pressure]]);
  humidityGaugeData = google.visualization.arrayToDataTable([['Label', 'Value'], ['Humidity', humidity]]);

  if (!tempGauge) {
    tempGauge = new google.visualization.Gauge(document.getElementById('temp_gauge'));
    pressureGauge = new google.visualization.Gauge(document.getElementById('pres_gauge'));
    humidityGauge = new google.visualization.Gauge(document.getElementById('humd_gauge'));
  }

  tempGauge.draw(tempGaugeData, tempGaugeOptions);
  pressureGauge.draw(pressureGaugeData, pressureGaugeOptions);
  humidityGauge.draw(humidityGaugeData, humidityGaugeOptions);

  // Only redraw charts if data window changed
  if (firstEnd === lastStartTime && lastEnd === lastEndTime) return;

  lastStartTime = firstEnd;
  lastEndTime = lastEnd;

  let tempData = new google.visualization.DataTable();
  tempData.addColumn('datetime', 'Time');
  tempData.addColumn('number', 'Temperature');
  let pressureData = new google.visualization.DataTable();
  pressureData.addColumn('datetime', 'Time');
  pressureData.addColumn('number', 'Pressure');
  let humidityData = new google.visualization.DataTable();
  humidityData.addColumn('datetime', 'Time');
  humidityData.addColumn('number', 'Humidity');
  let windData = new google.visualization.DataTable();
  windData.addColumn('number', 'X');
  windData.addColumn('number', 'Y');
  windData.addColumn({ type: 'string', role: 'tooltip', p: { html: true } });

  csvString = 'starttime,endtime,temperature,pressure,humdity,windspeed,winddirection,rainfall\n';

  for (let i = 0; i < data.length; i++) {
    tempData.addRow([new Date(data[i].endtime), data[i].temp]);
    pressureData.addRow([new Date(data[i].endtime), data[i].pres / 10]);
    humidityData.addRow([new Date(data[i].endtime), data[i].humd]);

    const rad = data[i].wdir * Math.PI / 180;
    const x = data[i].wisp * Math.cos(rad);
    const y = data[i].wisp * Math.sin(rad);
    const tooltip = `<div style="padding:5px 10px;"><b>Wind Speed:</b> ${data[i].wisp.toFixed(2)} m/s<br><b>Direction:</b> ${data[i].wdir.toFixed(0)}°</div>`;
    windData.addRow([x, y, tooltip]);

    csvString += `${data[i].starttime},${data[i].endtime},${data[i].temp},${data[i].pres},${data[i].humd},${data[i].wisp},${data[i].wdir},${data[i].rain}\n`;
  }

  const chartOptions = {
	curveType: 'function',
	legend: 'none', fontName: 'Rubik',
	hAxis: { format: 'HH:mm' },
	chartArea: {width: '88%', height: '85%', top: 8, left: '5%', right: 8}
  };
  if (!lineChart1) lineChart1 = new google.visualization.LineChart(document.getElementById('temp_chart'));
  lineChart1.draw(tempData, chartOptions);

  if (!lineChart2) lineChart2 = new google.visualization.LineChart(document.getElementById('pressure_chart'));
  lineChart2.draw(pressureData, chartOptions);

  if (!lineChart3) lineChart3 = new google.visualization.LineChart(document.getElementById('humidity_chart'));
  lineChart3.draw(humidityData, chartOptions);

  if (!windScatter) windScatter = new google.visualization.ScatterChart(document.getElementById('wind_scatter'));
  windScatter.draw(windData, {
    hAxis: { title: 'West  -  East' },
    vAxis: { title: 'South  -  North' },
	chartArea: {width: '85%', height: '80%', top: 8, left: 42},
    legend: 'none', fontName: 'Rubik',
    pointSize: 5,
    tooltip: { isHtml: true }
  });
}

const selDevice = q('select[name="device"]')[0];
function fetchMetrics() {
  fetch('/devices')
  .then(res => res.json())
  .then(function(data) {
    const selected = selDevice.selectedIndex > -1 ? selDevice.options[ selDevice.selectedIndex ].value : false;
    selDevice.innerHTML = '';
    for (let dev of data.devices)
      selDevice.appendChild(arc.elem(
        'option', ( dev.online ? '🟢' : '⚠️' ) + ' ' + dev.name.split('-')[0],
        (selected == dev.name ? {value: dev.name, selected: true} : {value: dev.name})
      ));
  })
  .catch(err => console.error('Error fetching devices:', err));

  const id = selDevice.selectedIndex > -1 ? selDevice.options[ selDevice.selectedIndex ].value : 'SIMULATOR';
  const selLimit = q('select[name="limit"]')[0];
  const limit = selLimit ? selLimit.value : 10;

  fetch('/data?device=' + id + '&limit=' + limit)
  .then(res => res.json())
  .then(data => drawCharts(data))
  .catch(err => console.error('Error fetching metrics:', err));
}

function startMonitoring() {
  fetchMetrics();
  /*const selLimit = q('select[name="limit"]')[0];
  selDevice.addEventListener('change', fetchMetrics);
  selLimit.addEventListener('change', fetchMetrics);*/
  document.getElementById('download_csv').addEventListener('click', () => {
    const blob = new Blob([csvString], {type: 'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'weather_data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
  setInterval(fetchMetrics, 1000);
}