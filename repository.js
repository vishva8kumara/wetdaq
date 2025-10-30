
const devices = {};

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

function device(_id) {
	const id = _id;
	let windowStart = new Date();
	let count = 0;
	let sumTemp = 0;
	let sumPres = 0;
	let sumHumd = 0;
	let sumWisp = 0;
	let sumSinWdir = 0;
	let sumCosWdir = 0;
	let sumRain = 0;
	let recent, clearRecent;
	//
	this.enqueue = function(dat){
		count += 1;
		sumTemp += 1.0 * dat.temp;
		sumPres += 1.0 * dat.prs;
		sumHumd += 1.0 * dat.hum;
		sumWisp += 1.0 * dat.wsp;
		sumSinWdir += Math.sin(dat.wdir * Math.PI / 180);
		sumCosWdir += Math.cos(dat.wdir * Math.PI / 180);
		sumRain += 1.0 * dat.rin;
		recent = dat;
		//clearTimeout(clearRecent);
		//clearRecent = setTimeout(function(){ recent = false; }, 10000);
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
		let avgWdir = Math.atan2(sumSinWdir / count, sumCosWdir / count) * 180 / Math.PI;
		const totRain = sumRain;
		const samples = count;
		const windowSt = windowStart;
		//
		if (avgWdir < 0)
			avgWdir += 360;
		//
		count = 0;
		sumTemp = 0;
		sumPres = 0;
		sumHumd = 0;
		sumWisp = 0;
		sumSinWdir = 0;
		sumCosWdir = 0;
		sumRain = 0;
		windowStart = now;
		//
		return [avgTemp, avgPres, avgHumd, avgWisp, avgWdir, totRain, samples, windowSt];
	};
};
