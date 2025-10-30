
const path = require('path');

let database, repository;

module.exports = {

	attach: function (db, repo) {
		database = db;
		repository = repo;
	},

	index: async function(req, res) {
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
		const device = req.query.device;
		let result = await database.queryAsync(
			'SELECT starttime, endtime, temp, pres, humd, wisp, wdir, rain ' +
			'FROM data '+
			(device ? 'WHERE device = ? ' : '')+
			'ORDER BY starttime DESC LIMIT 120', (device ? [device] : []));
		//
		if (device) {
			dev = repository.getDevice(device, false);
			const recent = dev ? dev.getRecent() : dev;
			res.send({data: result, recent: recent});
		}
		else
			res.send({data: result});
	}
};
