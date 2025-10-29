
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

	data: async function(req, res) {
		const device = req.query.device;
		let result = await database.queryAsync(
			'SELECT starttime, endtime, temp, pres, humd, wisp, wdir, rain ' +
			'FROM data '+
			(device ? 'WHERE device = ? ' : '')+
			'ORDER BY starttime DESC LIMIT 120', (device ? [device] : []));
		//
		if (device) {
			dev = repository.getDivice(device);
			const recent = dev.getRecent();
			res.send({data: result, recent: recent});
		}
		else
			res.send({data: result});
	}
};
