
let database, repository;

module.exports = {

	attach: function (db, repo) {
		database = db;
		repository = repo;
	},

	receive: function(req, res) {
		const dat = req.body;
		//
		const device = repository.getDivice(dat.device);
		device.enqueue(dat);
		//
		res.status(201).send('ok');
	}

};

const insertSQL = 'INSERT INTO data (starttime, endtime, device, temp, pres, humd, wisp, wdir, rain, samples) '+
	'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

async function processFiveMinuteSample(now) {
	const devices = repository.listDivices();
	for (let device in devices) {
		let aggResult = devices[ device ].aggregateOut(now);
		if (aggResult) {
			let [avgTemp, avgPres, avgHumd, avgWisp, avgWdir, totRain, samples, windowSt] = aggResult;
			database.queryAsync(insertSQL, [windowSt, now, device, avgTemp, avgPres, avgHumd, avgWisp, avgWdir, totRain, samples]);
		}
	}
}

let latch = false;
async function aggregate() {
	let now = new Date();
	const sec = now.getSeconds();
	if (sec > 10)
		latch = true;
	//
	else if (sec >= 0) {
		if ( latch ) {
			if (now.getMinutes() % 5 == 0) {
				processFiveMinuteSample(now);
			}
			latch = false;
		}
	}
	setTimeout(aggregate, 100);
}
aggregate();