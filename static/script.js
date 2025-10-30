google.charts.load('current', {'packages':['gauge', 'corechart']});
google.charts.setOnLoadCallback(startMonitoring);

let tempGauge, pressureGauge, humidityGauge, lineChart1, lineChart2, lineChart3;
let tempGaugeData, pressureGaugeData, humidityGaugeData, lineChartData1, lineChartData2, lineChartData3;
let tempGaugeOptions = { min: 0, max: 100, redFrom: 80, yellowFrom: 60, minorTicks: 5 };
let pressureGaugeOptions = { min: 0, max: 200, redFrom: 150, yellowFrom: 120, minorTicks: 5 };
let humidityGaugeOptions = { min: 0, max: 100, redFrom: 60, yellowFrom: 45, minorTicks: 5 };

function drawCharts(metrics) {
	let tempData = new google.visualization.DataTable();
	tempData.addColumn('datetime', 'Time');
	tempData.addColumn('number', 'Temperature');
	let pressureData = new google.visualization.DataTable();
	pressureData.addColumn('datetime', 'Time');
	pressureData.addColumn('number', 'Pressure');
	let humidityData = new google.visualization.DataTable();
	humidityData.addColumn('datetime', 'Time');
	humidityData.addColumn('number', 'Humidity');
	//
	let data = metrics.data;
	const temperature = metrics.recent ? 1.0*metrics.recent.temp : data[0].temp;
	const pressure = metrics.recent ? 0.1*metrics.recent.prs : data[0].pres/10;
	const humidity = metrics.recent ? 1.0*metrics.recent.hum : data[0].humd;

	// Update line chart dataset
	for (let i = 0 ; i < data.length; i++) {
		tempData.addRow([new Date(data[i].endtime), data[i].temp]);
		pressureData.addRow([new Date(data[i].endtime), data[i].pres/10]);
		humidityData.addRow([new Date(data[i].endtime), data[i].humd]);
	}

	// Gauges
	tempGaugeData = google.visualization.arrayToDataTable([
		['Label', 'Value'],
		['Temperature', temperature]
	]);
	pressureGaugeData = google.visualization.arrayToDataTable([
		['Label', 'Value'],
		['Pressure', pressure]
	]);
	humidityGaugeData = google.visualization.arrayToDataTable([
		['Label', 'Value'],
		['Humidity', humidity]
	]);

	if (!tempGauge) {
		tempGauge = new google.visualization.Gauge(document.getElementById('temp_gauge'));
		pressureGauge = new google.visualization.Gauge(document.getElementById('pres_gauge'));
		humidityGauge = new google.visualization.Gauge(document.getElementById('humd_gauge'));
	}
	tempGauge.draw(tempGaugeData, tempGaugeOptions);
	pressureGauge.draw(pressureGaugeData, pressureGaugeOptions);
	humidityGauge.draw(humidityGaugeData, humidityGaugeOptions);

	// Line Chart
	if (!lineChart1) lineChart1 = new google.visualization.LineChart(document.getElementById('temp_chart'));
	lineChart1.draw(tempData, {
		curveType: 'function',
		legend: 'none',
		hAxis: { format: 'HH:mm' }
	});
	//
	if (!lineChart2) lineChart2 = new google.visualization.LineChart(document.getElementById('pressure_chart'));
	lineChart2.draw(pressureData, {
		curveType: 'function',
		legend: 'none',
		hAxis: { format: 'HH:mm' }
	});
	//
	if (!lineChart3) lineChart3 = new google.visualization.LineChart(document.getElementById('humidity_chart'));
	lineChart3.draw(humidityData, {
		curveType: 'function',
		legend: 'none',
		hAxis: { format: 'HH:mm' }
	});
	//
}

const selDevice = q('select[name="device"]')[0];
function fetchMetrics() {//c987fad0-d518-4c52-a7e2-78fcf5f3df3b
	fetch('/devices')
	.then(res => res.json())
	.then(function(data) {
		const selected = selDevice.selectedIndex > -1 ? selDevice.options[ selDevice.selectedIndex ].value : false;
		selDevice.innerHTML = '';
		for (let dev of data.devices)
			selDevice.appendChild(arc.elem(
				'option', '[' + ( dev.online ? 'v' : 'x' )+ '] ' + dev.name,
				(selected == dev.name ? {value: dev.name, selected: true} : {value: dev.name})
		));
	})
	.catch(err => console.error('Error fetching devices:', err));
	//
	const id = selDevice.selectedIndex > -1 ? selDevice.options[ selDevice.selectedIndex ].value : 'SIMULATOR';//selDevice.sele*///'c987fad0-d518-4c52-a7e2-78fcf5f3df3b'
	//
	fetch('/data?device='+id)
	.then(res => res.json())
	.then(data => drawCharts(data))
	.catch(err => console.error('Error fetching metrics:', err));
}

function startMonitoring() {
	fetchMetrics();
	setInterval(fetchMetrics, 1000); // every 5 seconds
}