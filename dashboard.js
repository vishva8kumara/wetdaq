
const path = require('path');

let database, repository;

module.exports = {

	attach: function (db, repo) {
		database = db;
		repository = repo;
	},

	index: async function(req, res) {
		console.log(req.ip, req.headers['user-agent']);
		res.sendFile(path.join(__dirname, 'index.html'));
	},

	devices: async function(req, res) {
		const result = await database.queryAsync('SELECT DISTINCT device FROM data');
		const devices = repository.listDevices();
		//
		let output = [];
		for (let row of result) {
			output.push({name: row.device, online: (
				devices[row.device] && devices[row.device].getRecent() ? true : false)});
		}
		res.send({devices: output});
	},

	data: async function(req, res) {
		if (req.query.device) {
			const device = req.query.device;
			const limit = req.query.limit ? 1 * req.query.limit : 20;
			let result = await database.queryAsync(
				'SELECT starttime, endtime, temp, pres, humd, wisp, wdir, rain ' +
				'FROM data WHERE device = ? '+
				'ORDER BY starttime DESC LIMIT ?', [device, limit]);
			//
			dev = repository.getDevice(device, false);
			const recent = dev ? dev.getRecent() : dev;
			res.send({data: result, recent: recent});
		}
		else {
			//(device ? 'WHERE device = ? ' : '')+
			//(device ? [device, limit] : [limit])
			//res.send({data: result});
			res.status(403).send('bad request');
		}
	},

	perDay: async function(req, res) {
		if (req.query.device) {
			const device = req.query.device;
			console.log('Querying for: ', device);
			let result = await database.queryAsync(
				'SELECT CONCAT(DATE(starttime), \' \', HOUR(starttime)) AS hour, '+
					'MIN(temp) AS min_temperature, MAX(temp) AS max_temperature, ROUND(AVG(temp), 4) AS avg_temperature, '+
					'MIN(pres) AS min_pressure, MAX(pres) AS max_pressure, ROUND(AVG(pres), 4) AS avg_pressure, '+
					'MIN(humd) AS min_humidity, MAX(humd) AS max_humidity, ROUND(AVG(humd), 4) AS avg_humidity, '+
					'SUM(rain) AS total_rainfll, '+

					'ROUND(SQRT( '+
							'SUM(wisp * COS(RADIANS(wdir))) * SUM(wisp * COS(RADIANS(wdir))) + '+
							'SUM(wisp * SIN(RADIANS(wdir))) * SUM(wisp * SIN(RADIANS(wdir))) '+
						') / COUNT(*), 3) AS avg_wind_speed, '+

					'ROUND(MOD(DEGREES( '+
						'ATAN2(SUM(wisp * SIN(RADIANS(wdir))), '+
							'SUM(wisp * COS(RADIANS(wdir))) '+
						')) + 360, 360), 3) AS avg_wind_direction '+

				'FROM data '+
				'WHERE device = ? '+
				'GROUP BY hour', [device]);
			//
			const headers = Object.keys(result[0]);
			const csvLines = [
				headers.join(','),
				...result.map(row =>
					headers.map(h => {
						const val = row[h] ?? '';
						return `"${String(val).replace(/"/g, '""')}"`;
					}).join(',')
				)
			];
			const csvString = csvLines.join('\n');
			//
			res.setHeader('Content-Disposition', 'attachment; filename=\"weather_data.csv\"');
			res.setHeader('Content-Type', 'text/csv');
			res.send(csvString);
		}
		else {
			res.status(403).send('bad request');
		}
	}

};
