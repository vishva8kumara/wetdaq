
const path = require('path');

let database;

module.exports = {

	attach: function (att) {
		database = att;
	},

	index: async function(req, res) {
		res.sendFile(path.join(__dirname, 'index.html'));
	},

	data: async function(req, res) {
		let result = await database.queryAsync(
			'SELECT starttime, endtime, temp, pres, humd, wisp, wdir, rain ' +
			'FROM data ORDER BY starttime DESC LIMIT 120');
		res.send(result);
	}
};
