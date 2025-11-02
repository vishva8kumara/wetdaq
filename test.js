
const http = require('http');
//const { exec } = require('child_process');

async function simulate() {
	const value = 450 + parseInt(Math.random() * 100);
	const now = new Date();
	const data = 'device=SIMULATOR&temp='+(33 + (Math.random() * 3))+
			'&hum='+(60 + (Math.random() * 2))+'&rin=0.00&prs='+(1011 + (Math.random() * 2))+
			'&wdir='+(270 + (Math.random() * 20))+'&wsp='+(5 + (Math.random() * 2.5));
	//
	console.log('sending', data);
	const req = http.request({
			hostname: 'daq.info.lk',
			port: 80,
			path: '/rx',
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			}
		},
		function(res) {
			console.log(res.statusCode);
			//console.log(res);
		}
	);
	req.write(data);
	req.end();
	//
	setTimeout(simulate, 10 * value);
}

simulate();