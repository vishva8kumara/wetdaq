
const devices = {};

function device(_id) {
	const id = _id;
	let windowStart = new Date();
	let count = 0;
	let sumTemp = 0;
	let sumPres = 0;
	let sumHumd = 0;
	let sumWisp = 0;
	let sumWdir = 0;
	let sumRain = 0;
	let recent;
	//
	this.enqueue = function(dat){
		count += 1;
		sumTemp += 1.0 * dat.temp;
		sumPres += 1.0 * dat.prs;
		sumHumd += 1.0 * dat.hum;
		sumWisp += 1.0 * dat.wsp;
		sumWdir += 1.0 * dat.wdir;
		sumRain += 1.0 * dat.rin;
		recent = dat;
	};
	//
	this.getRecent = function(){
		return recent;
	};
	//
	this.aggregateOut = function(now){
		if (count == 0) {
			delete devices[ id ];
			return false;
		}
		//
		const avgTemp = sumTemp / count;
		const avgPres = sumPres / count;
		const avgHumd = sumHumd / count;
		const avgWisp = sumWisp / count;
		const avgWdir = sumWdir / count;
		const totRain = sumRain;
		const samples = count;
		const windowSt = windowStart;
		//
		count = 0;
		sumTemp = 0;
		sumPres = 0;
		sumHumd = 0;
		sumWisp = 0;
		sumWdir = 0;
		sumRain = 0;
		windowStart = now;
		//
		return [avgTemp, avgPres, avgHumd, avgWisp, avgWdir, totRain, samples, windowSt];
	};
};

module.exports = {

	listDevices: function(){
		return devices;
	},

	getDevice: function(id, create=true){
		if (devices[id])
			return devices[id];
		//
		else {
			if (create)
				devices[id] = new device(id);
			//
			return devices[id];
		}
	}

};
