
const mysql = require('mysql2');

module.exports = function(logger, config, dbConnRetryParams){

	config = JSON.parse(JSON.stringify(config));
	let connection = null;
	let connected = false;
	let connecting = false;
	let adapter = false;
	let buffer = [];
	let retryTimeout = 2000;

	this.connect = function(){
		if (typeof dbConnRetryParams == 'undefined' || typeof dbConnRetryParams.retryMinTimeout == 'undefined')
			dbConnRetryParams = {retryMinTimeout: 2000, retryMaxTimeout: 60000};
		retryTimeout = dbConnRetryParams.retryMinTimeout;
		//
		debounceReconnect(0);
		//
		adapter = {
			query: function(q, p, cb){
				if (connected)
					connection.query(q, p, function(err, res){
						if (err && err.code == 'ECONNRESET'){
							connecting = false;
							connected = false;
							logger.error('Database Unreachable: '+config.database+': '+err.code+' - Retrying');
							buffer.push({query: q, params: p, callback: cb});
							debounceReconnect(0);
						}
						else{
							cb(err, res);
						}
					});
				else
					buffer.push({query: q, params: p, callback: cb});
			},
			queryAsync: async function(q, p){
				return new Promise(function(resolve, reject){
					adapter.query(q, p, function(err, res){
						if (err)
							reject(err);
						//
						else
							resolve(res);
					});
				});
			},
			end: function(){
				connection.end();
			},
			beginTransaction: function(callback){
				connection.beginTransaction(callback);
			},
			commit: function(callback){
				connection.commit(callback);
			},
			rollback: function(callback){
				connection.rollback(callback);
			},
			close: function(){
				retryTimeout = dbConnRetryParams.retryMinTimeout;
				logger.warn('Disconnecting from Database: '+config.database);
				connection.end();
				delete connection;
				delete this;
			}
		};
		return adapter;
	};

	let debounceReconnect = function(attempt){
		if (connected || connecting)
			return false;
		connecting = true;
		//
		try{
			connection.end();
		}catch(e){}
		//
		if (attempt == 0)
			persistantConnection(0);
		else{
			logger.warn('ReConnecting in '+(retryTimeout / 1000)+'s');
			setTimeout(
				function(){
					persistantConnection(attempt);
				},
				retryTimeout
			);
			if (retryTimeout < dbConnRetryParams.retryMaxTimeout)
				retryTimeout += 1000;
		}
	};

	let persistantConnection = function(attempt){
		connection = mysql.createConnection(config);
		connection.connect(
			function (err){
				connecting = false;
				if (err){
					connected = false;
					logger.error('Database Connection error ['+config.database+']: '+err.code);
					debounceReconnect(attempt+1);
				}
				else{
					connected = true;
					retryTimeout = dbConnRetryParams.retryMinTimeout;
//					logger.log('Connected to Database: '+config.database);
					//
					while (buffer.length > 0){
						let obj = buffer.shift();
						adapter.query(obj.query, obj.params, obj.callback);
					}
				}
			}
		);
		connection.on('error',
			function (err){
				connected = false;
				connecting = false;
				logger.error('Database Connection error ['+config.database+']: '+err.code);
				debounceReconnect(0);
				if (['PROTOCOL_CONNECTION_LOST', 'PROTOCOL_PACKETS_OUT_OF_ORDER'].indexOf(err.code) == -1)
					logger.error(err);
			}
		);
	};

};
