
let database;
let count = 0;
let sumTemp = 0;
let sumPres = 0;
let sumHumd = 0;
let sumWisp = 0;
let sumWdir = 0;
let sumRain = 0;

module.exports = {

	attach: function (att) {
		database = att;
	},

	receive: function(req, res) {
		const dat = req.body;
		//
		count += 1;
		sumTemp += dat.temp;
		sumPres += dat.prs;
		sumHumd += dat.hum;
		sumWisp += dat.wsp;
		sumWdir += dat.wdir;
		sumRain += dat.rin;
		//
		res.status(201).send('ok');
	}

};

let windowStart = new Date();
const insertSQL = 'INSERT INTO data (starttime, endtime, temp, pres, humd, wisp, wdir, rain) '+
	'VALUES (?, ?, ?, ?, ?, ?, ?, ?)';

async function processFiveMinuteSample(now) {
	if (count == 0)
		return false;
	//
	const avgTemp = sumTemp / count;
	const avgPres = sumPres / count;
	const avgHumd = sumHumd / count;
	const avgWisp = sumWisp / count;
	const avgWdir = sumWdir / count;
	const avgRain = sumRain / count;
	//
	count = 0;
	sumTemp = 0;
	sumPres = 0;
	sumHumd = 0;
	sumWisp = 0;
	sumWdir = 0;
	sumRain = 0;
	//
	database.queryAsync(insertSQL, [windowStart, now, avgTemp, avgPres, avgHumd, avgWisp, avgWdir, avgRain]);
	//
	windowStart = now;
	/*/
	const momSum = calculateSum(values);
	const momLength = values.length;
	values = [];
	//
	const output = {
		"window_start": now,
		"count": momLength,
		"sum": momSum
	};
	console.log(output);
	//
	const frame = {
		'temp': dat.temp,
		'pres': dat.prs,
		'humd': dat.hum,
		'wisp': dat.wsp,
		'wdir': dat.wdir,
		'rain': dat.rin
	};
	data.push(frame);
	console.log(frame);
	//
	while (data.lengh > 25)
		data.shift();
	/*/
}

let latch = false;
async function aggregate() {
	let now = new Date();
	const sec = now.getSeconds();
	if (sec > 10)
		latch = false;
	//
	else if (sec >= 0) {
		if ( ! latch ) {
			if (now.getMinutes() % 5) {
				processFiveMinuteSample(now);
			}
			latch = true;
		}
	}
	setTimeout(aggregate, 100);
}
aggregate();