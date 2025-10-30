
/**
 * Useful functions for API Integrations and Data-Mining
 * * HTTP Client with Retry and Rate-limit [Code 429] Throttling
 * * Multipart Response Handler
 * * Multipart Decode / Parse
 * 
 * Vishva Kumara N P [2024]
 */

const https = require('https');
const http = require('http');
const crypto = require('crypto');

const utils = module.exports = {

	hash: function(str) {
		return crypto.createHash('md5').update(str).digest('hex');
	},

	dateSQL: function(date) {
		return date.sqlFormatted();
	},

	decodeEntities: function(encodedString) {
		let translate_re = /&(nbsp|amp|quot|lt|gt|lsquo|rsquo|ldquo|rdquo|zwj|zwnj);/g;
		let translate = { "nbsp":" ", "amp": "&", "quot": "\"", "lt": "<", "gt": ">", "lsquo": '"', "rsquo": '"', "ldquo": '"', "rdquo": '"', "zwj": '‍', "zwnj": '' };
		let tmp1 = encodedString.replace(translate_re, function(_match, entity) {
			return translate[entity];
		});
		let tmp2 = tmp1.replace(/&#(\d+);/gi, function(match, numStr) {
			let num = parseInt(numStr, 10);
			return String.fromCharCode(num);
		});
		return tmp2.trim();
	},

	handlePost: function(req, callback){
		var body = '';
		req.on('data', function (data){
			body += data;
		});
		req.on('end', function (data){
			var post = body;
			if (post.substr(-2) == '[]'){
				post += '}';
			}
			try{
				post = JSON.parse(post);
			}
			catch(e){
				try{
					post = post.replace(/u'/g, '"').replace(/'/g, '"');
					post = JSON.parse(post);
				}
				catch(e){}
			}
			callback(post);
		});
	},

	getHeader: function(headers, key) {
		key = key.toLowerCase();
		for (let header of headers) {
			if (header.name.toLowerCase() == key)
				return header.value;
		}
		return '';
	},

	getBody: function(payload) {
		if (payload.body.data) {
			return (Buffer.from(payload.body.data, 'base64')).toString();
		}
		else {
			const partHTML = getHTMLBodyPart(payload.parts);
			try {
				const htmlBody = (Buffer.from(partHTML.body.data, 'base64')).toString();
				return htmlBody;
			}
			catch(e) {
				console.error(partHTML, e);
				return '';
			}
		}
	},

	apiAuth: async function(apiHost, port, apiPath) {
		return new Promise( function(resolve, reject){
			let apiCall = https.request(
				{port: port, method: 'GET', host: apiHost, path: apiPath},
				function(response){
					response.setEncoding('utf8');
					if (response.statusCode == 429) {
						console.log('=====\nCode: ', response.statusCode,
							'\nRetry-After: ', 1*response.headers['retry-after']);
						setTimeout(async function(){
							resolve(await utils.apiAuth(apiUser, apiPass));
						}, 1000 * response.headers['retry-after']);
					}
					else
						utils.handlePost(response, function(apiData){
							if ([200, 201].indexOf(response.statusCode) == -1)
								console.log('=====\nCode: ', response.statusCode);
							resolve(apiData);
						});
				}
			);
			apiCall.on('error', reject);
			apiCall.end();
		});
	},

	apiRequest: async function(method, host, port, path, headers, data, ssl=true) {
		const useMethod = method ? method : ( data ? 'POST' : 'GET' );
		//
		return new Promise( function(resolve, reject){
			let apiCall = (ssl ? https : http).request(
				{port: port, method: useMethod, host: host, path: path, headers: headers},
				function(response){
					response.setEncoding('utf8');
					if (response.statusCode == 429) {
						console.log('=====\nCode: ', response.statusCode,
							'\n'+(method || ( data ? 'POST' : 'GET' )), ': ', host, path,
							'\nRetry-After: ', 1*response.headers['retry-after']);
						setTimeout(async function(){
							resolve(await utils.apiRequest(method, host, port, path, headers, data));
						}, 1000 * response.headers['retry-after']);
					}
					else
						utils.handlePost(response, function(apiData){
							if ([200, 201].indexOf(response.statusCode) == -1)
								console.log('=====\nCode: ', response.statusCode,
									'\n'+(method || ( data ? 'POST' : 'GET' )), ': ', host, path, response.rawHeaders);
							resolve(apiData);
						});
				}
			);
			apiCall.on('error', reject);
			//
			if (data)
				apiCall.write(data);
			//
			apiCall.end();
		});
	},

	apiClient: function(host, port = 10000, headers, ssl=true) {
		const MAX_RETRIES = 2;
		const RETRY_DELAY = 800;
		const retry = async function(...args) {
			let attempts = 0;
			while (attempts < MAX_RETRIES) {
				try {
					return await utils.apiRequest(...args);
				}
				catch (e) {
					attempts++;
					if (attempts >= MAX_RETRIES)
						throw e;
					//
					else {
						console.error('NETWORK: ', e);//Object.values(e).join(', '));
						await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, attempts - 1)));
					}
				}
			}
		};
		const client = {
			'get': async function(host, path) {
				return retry('GET', host, port, path, headers, false, ssl);
			},
			'post': async function(path, data) {
				return retry('POST', host, port, path, headers, data, ssl);
			},
			'put': async function(path, data) {
				return retry('PUT', host, port, path, headers, data, ssl);
			},
			'req': async function(method, path, data) {
				return retry(method, host, port, path, headers, data, ssl);
			}
		};
		return client;
	}

};

function getHTMLBodyPart(parts){
	for (let part of parts) {
		if (part.mimeType == 'text/html') {
			return part;
		}
		else if (part.mimeType == 'multipart/alternative') {
			return getHTMLBodyPart(part.parts);
		}
		else
			console.log(part.mimeType);
	}
	return {};
}

Date.prototype.sqlFormatted = function () {
	let yyyy = this.getFullYear().toString();
	let mm = (this.getMonth() + 1).toString();
	let dd = this.getDate().toString();
	return (
		yyyy + "-" + (mm[1] ? mm : "0" + mm[0]) + "-" + (dd[1] ? dd : "0" + dd[0])
	);
};
