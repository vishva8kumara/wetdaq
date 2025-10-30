
/*
* Arc Reactor JavaScript library/framework
* https://github.com/vishva8kumara/arc-reactor
* Vishva Kumara N P - vishva8kumara@gmail.com
* Distributed Under MIT License
* See index.html for the demonstration;
* 	refer to the embedded JS there for documentation.
*
* Font-Awsome and Roboto Font is redistributed with this under
* their respective licenses, and not covered under this MIT license.
*
*/

var arc = new (function arcReactor(root){

	var arc = this;
	var arrayIgnore = ['min', 'max', 'sum', 'avg', 'each'];
	var loadTS = (new Date()).getTime().toString(32);


	// ------------------------------------------------------------------------------------
	//	Navigation handler / wrapper for SPA
	// ------------------------------------------------------------------------------------

	this.navigationActiveStack = [];
	var backButtonStack = [];
	var navigationTable = {};

	//	Create a nav frame
	this.nav = function(hash, obj, callback, kcabllac){
		if (callback.constructor.name == 'arcRequire')
			navigationTable[hash] = [obj, callback.onload, callback.onunload];
		//
		else
			navigationTable[hash] = [obj, callback, kcabllac];
		//
		if (typeof obj == 'undefined' || obj == null)
			console.error('Expected [object HTMLElement]: parameter 2 for arc.nav()');
			//throw 'Expected [object HTMLElement]: parameter 2 for arc.nav()';
		else
			obj.style.display = 'none';
			//obj.hide();
	};


	// ------------------------------------------------------------------------------------
	//	DYNAMIC SCRIPT AND TEMPLATE LOADER
	// ------------------------------------------------------------------------------------

	var loaderTemplates = {}, loaderScripts = {};
	this.require = function(script, template, cacheTimer){
		//
		// Use URL versioning to request a new version everytime the resource is loaded (Not required with Cloud CDN)
		// if (base_url.indexOf('://localhost:') == -1){
		// 	script += '?v='+loadTS;
		// 	template += '?v='+loadTS;
		// }
		//
		//if (typeof cacheTimer == 'undefined')	cacheTimer = 10;
		//
		return new (function arcRequire(){
			var mod = false, tLoaded = false, _self = this;
			//
			this.preload = setTimeout(function(){
				new arc.ajax(template, {
					method: GET,
					callback: function(data){
						loaderTemplates[template] = data.responseText;
					}
				});
				new arc.ajax(script, {
					method: GET,
					callback: function(data){}
				});
				/*var scr = arc.elem('script', null, {'type': 'text/javascript', 'src': script});
				scr.onload = function(){
					loaderScripts[script] = module.exports;
					module = {'exports': {}};
				};
				document.head.appendChild(scr);*/
			}, 1800);
			//
			//	Onload Handler - Function to-be called on navigating into activity
			this.onload = function(context, params, e, loadedCallback){
				tLoaded = false;
				clearTimeout(_self.preload);
				//	Dispatch callbacks - bind template to script
				var exec = function(code){
					var charts = context.q('.chart');
					for (var c = 0; c < charts.length; c++)
						charts[c].innerHTML = loadingIndicator;
					if (typeof code != 'undefined'){
						mod = code;
//console.log('Script ready');
					}
					//	Ready to go ?
					if (tLoaded && !!mod){
//console.log('Script and Template Ready');
						if (typeof mod == 'object' && typeof mod.onload == 'function'){
							if (mod.onload.length == 4)
								mod.onload(context, params, e, loadedCallback);
							else{
								mod.onload(context, params, e);
								loadedCallback();
							}
							//module = false;
						}
						else{
							if (typeof loadedCallback == 'function')
								loadedCallback();
							console.error('No onload method in :'+script);
						}
					}
				};
				//
				//	Load Script
				if (typeof loaderScripts[script] != 'undefined'){
					exec(loaderScripts[script]);
				}
				else{
					var scr = arc.elem('script', null, {'type': 'text/javascript', 'src': script});
					scr.onload = function(){
						loaderScripts[script] = module.exports;
						module = {'exports': {}};
						exec(loaderScripts[script]);
					};
					document.head.appendChild(scr);
				}
				//
				//	Load Template
				if (typeof loaderTemplates[template] != 'undefined'){
					context.innerHTML = loaderTemplates[template];
					tLoaded = true;
//console.log('Template from cache');
					exec();
				}
				else{
					context.innerHTML = '';
					new arc.ajax(template, {
						method: GET,
						callback: function(data){
							context.innerHTML = data.responseText;
							tLoaded = true;
//console.log('Template from ajax');
							exec();
							loaderTemplates[template] = data.responseText;
						}
					});
				}
			};
			//
			//	OnUnload Handler
			this.onunload = function(context, params, e){
				if (tLoaded && !!mod){
					if (typeof mod == 'object' && typeof mod.onunload == 'function')
						mod.onunload(context, params, e);
					//
					else
						console.warn('No onunload method in :'+script);
				}
				//
				else
					console.error('onunload called before onload :'+script);
			};
		});
	};

	window.onpopstate = function(event){
		//	Process difference of states
		let tmpStack = [];
		let onLoadCallCandidates = [];
		hash = document.location.hash.replace('#', '').split('/');
		for (let i = 0; i < hash.length; i++){
			let path = hash.slice(0, i+1).join('/');
			if (typeof navigationTable[path] != 'undefined'){
				tmpStack.push(navigationTable[path].concat([hash.slice(i+1).join('/')]));
				//	List candidate onload functions - we are calling only the last
				if (typeof navigationTable[path][1] == 'function' && (!existInActiveStack(navigationTable[path][0], hash.slice(i+1).join('/')) || (typeof event != 'undefined' && typeof event.forcePop != 'undefined')))
					onLoadCallCandidates.push([navigationTable[path], hash.slice(i+1)]);
			}
		}
		if (onLoadCallCandidates.length == 0)
			return false;
		//
		//let waitLoading = false;
		let waitRenderCallback = function(){
			//arc.waitRenderCallback = function(){};
			//	Show frames to be active
//console.info('4) Module released view to appear', arc.navigationActiveStack);
			arc.navigationActiveStack = [];
			for (let i = 0; i < tmpStack.length; i++){
				tmpStack[i][0].style.display = 'block';
				new function(obj){
					setTimeout(function(){obj.addClass('active');}, 10);
				}(tmpStack[i][0]);
				arc.navigationActiveStack.push(tmpStack[i]);
			}
		};
//console.info('1) View stack resolved');
		//
		//	Hide frames to be inactive
		for (let i = 0; i < arc.navigationActiveStack.length; i++)
			if (!existInStack(tmpStack, arc.navigationActiveStack[i])){
				//	Call onUnload function
				if (typeof arc.navigationActiveStack[i][2] == 'function')
					arc.navigationActiveStack[i][2](arc.navigationActiveStack[i][0], event);
				arc.navigationActiveStack[i][0].removeClass('active');
				new function(obj){
					setTimeout(function(){obj.style.display = 'none';}, 250);
					//setTimeout(function(){obj.style.display = 'none';}, 750);
				}(arc.navigationActiveStack[i][0]);
//console.info('2) Hiding frame', arc.navigationActiveStack[i][0]);
			}
		//
		//	Call onload function
		onLoadCallCandidates = onLoadCallCandidates[onLoadCallCandidates.length - 1];
		if (onLoadCallCandidates[0][1].length == 4){
//console.info('3) Waiting on module to render');
			onLoadCallCandidates[0][1](onLoadCallCandidates[0][0], onLoadCallCandidates[1], event, function(){});
			//waitLoading = true;
		}
		else{
			onLoadCallCandidates[0][1](onLoadCallCandidates[0][0], onLoadCallCandidates[1], event);
		}
		let charts = onLoadCallCandidates[0][0].q('.chart');
		for (let c = 0; c < charts.length; c++)
			charts[c].innerHTML = loadingIndicator;
		//
		//	Send pageview to Google Analytics
		if (typeof ga == 'function')
			ga('send', 'pageview', document.location.pathname+document.location.hash);
		//
		//	Display frames right-away
		//if (!waitLoading){
//console.info('3) Rendering Immidiately');
		waitRenderCallback();
		//}
		//
		document.body.scrollLeft = 0;
		document.body.scrollTop = 0;
		backButtonStack = [];
		/*if (navigator.vibrate)
			navigator.vibrate(25);*/
		//
		//	Set classname for the parent of active anchor
		let anchors = document.querySelectorAll('nav a[href^=\\#], ul.tabs a[href^=\\#]');
		for (let i = 0; i < anchors.length; i++){
			if (document.location.hash.substring(1).startsWith(anchors[i].href.split('#')[1]))
				anchors[i].parentNode.addClass('loading-m');
			else
				anchors[i].parentNode.removeClass('loading-m');
		}
		setTimeout(function(){
			let anchors = document.querySelectorAll('nav a[href^=\\#], ul.tabs a[href^=\\#]');
			for (let i = 0; i < anchors.length; i++){
				if (document.location.hash.substring(1).startsWith(anchors[i].href.split('#')[1]))
					anchors[i].parentNode.addClass('active');
				else
					anchors[i].parentNode.removeClass('active');
			}
		}, 125);
	};

	var existInActiveStack = function(dom, params){
		for (let i = 0; i < arc.navigationActiveStack.length; i++)
			if (arc.navigationActiveStack[i][0] == dom && arc.navigationActiveStack[i][3] == params)
				return true;
		return false;
	};

	var existInStack = function(tmpStack, obj){
		for (let i = 0; i < tmpStack.length; i++)
			if (tmpStack[i][0] == obj[0])
				return true;
		return false;
	};

	this.enqBackBtnStack = function(callback){
		backButtonStack.push(callback);
	};


	// ------------------------------------------------------------------------------------
	//	Make Ajax requests
	// ------------------------------------------------------------------------------------

	var ajaxCache = {};
	this.ajax = function(url, options, ref){
		//	Ensure this function is always called as a dynamic instance
		if (this == arc)
			return new arc.ajax(url, options, ref);
		//
		var _this = this;
		this.method = 'GET';
		this.data = null;
		this.callback = function(data){console.log(data);};
		this.failback = function(data){console.log(data);};
		this.headers = {};
		this.evalScripts = false;
		this.doCache = false;
		this.async = true;
		this.timeout = -1;
		//	Option aliasing
		let opts = {'method': 'method', 'type': 'method', 'data': 'data', 'form': 'data', 'callback': 'callback', 'success': 'callback',
				'failback': 'failback', 'fallback': 'failback','error': 'failback', 'progress': 'progress', 'onprogress': 'progress',
				'async': 'async', 'asynchronous': 'async', 'timeout': 'timeout', 'ontimeout': 'ontimeout', 'url': 'url', 'uri': 'url',
				'headers': 'headers', 'evalScripts': 'evalScripts', 'eval': 'evalScripts', 'doCache': 'doCache', 'cache': 'doCache'};
		if (typeof url == 'object' && (typeof url['url'] != 'undefined' || typeof url['uri'] != 'undefined')){
			ref = options;
			options = url;
			url = options['url'] || options['uri'];
		}
		//	Process option aliases
		for (let key in options)
			if (typeof opts[key] != 'undefined')
				this[opts[key]] = options[key];
			else
				console.log('Ajax: Unrecognized option \''+key+'\' with value: '+options[key]);
		//
		this.abort = function(){
			_this.failback = function(a, b){};
			_this.xmlhttp.abort();
		};
		//	Deliver the result to callback
		this.deliverResult = function(data){
			if (typeof _this.callback == 'function'){
				try{
					if (data.getResponseHeader('content-type') == 'application/json')
						data.data = JSON.parse(data.responseText);
				}catch(e){}
				_this.callback(data, ref);
			}
			else if (typeof _this.callback == 'object' && _this.callback.toString().indexOf("Element") > -1)
				_this.callback.innerHTML = data.responseText;
			else{
				let elem = document.getElementById(_this.callback);
				if (typeof elem == 'object' && elem.toString().indexOf("Element") > -1)
					elem.innerHTML = data.responseText;
				else
					console.log('Ajax: Callback \''+_this.callback+'\' is neither function, nor object or an ID of an object.');
			}
			//	DEPRECATED - LEGACY SUPPORT OF SAMEORIGIN INLINE JS
			/*if (typeof _this.evalScripts != 'undefined'){
				let P0 = data.responseText.indexOf('<script');
				while (P0 > -1){
					P0 = data.responseText.indexOf('>', P0) + 1;
					let P1 = data.responseText.indexOf('</script', P0);
					if (typeof _this.evalScripts != 'function')
						_this.evalScripts(data.responseText.substring(P0, P1));
					else
						try{
							eval(data.responseText.substring(P0, P1));
						}
						catch (e){
							console.log(e);
						}
					P0 = data.responseText.indexOf('<script', P1);
				}
			}*/
		};
		//
		if (this.doCache === true && typeof localStorage[url] != 'undefined'){
			_this.deliverResult({responseText: localStorage[url], response: localStorage[url], responseURL: url, status: 200, statusText: 'From Cache'});
			return true;
		}
		else if (isNumber(this.doCache) && typeof ajaxCache[url] != 'undefined'){
			_this.deliverResult({responseText: ajaxCache[url], response: ajaxCache[url], responseURL: url, status: 200, statusText: 'From Cache'});
			return true;
		}
		else if (this.doCache == false)
			localStorage.removeItem(url);
		//
		if (window.XMLHttpRequest)
			this.xmlhttp = new XMLHttpRequest();
		else if (window.ActiveXObject)
			this.xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
		//
		this.xmlhttp.open(_this.method.toUpperCase(), url, _this.async);
		this.xmlhttp.onreadystatechange = function (){
			if (this.readyState == 4){
				if (this.status == 200){
					_this.deliverResult(this);
					if (_this.doCache === true)
						localStorage[url] = this.responseText;
					else if (isNumber(_this.doCache)){
						ajaxCache[url] = this.responseText;
						new (function(url){
							setTimeout(function(){
								delete ajaxCache[url];
							}, _this.doCache * 1000);
						})(url);
					}
				}
				else if (typeof _this.failback == 'function')
					_this.failback(this, ref);
			}
		};
		if (typeof _this.progress == 'function')
			this.xmlhttp.onprogress = function(data){
				_this.progress(100 * data.loaded / data.total)
			};
		if (typeof _this.ontimeout == 'function' && _this.timeout != -1){
			this.xmlhttp.ontimeout = _this.ontimeout;
			this.xmlhttp.timeout = _this.timeout;
		}
		//
		if (typeof _this.headers != 'undefined')
			for (let key in _this.headers)
				this.xmlhttp.setRequestHeader(key, _this.headers[key]);
		if (csrftoken != false)
			this.xmlhttp.setRequestHeader("X-CSRFToken", csrftoken);
		//
		if (_this.method.toUpperCase() == "POST"){
			let params = '';
			if (_this.data == null){}
			else if (_this.data.toString().indexOf("Form") > -1 && (typeof _this.data.tagName != 'undefined' && _this.data.tagName == "FORM")){
				for (let i = 0; i < _this.data.elements.length; i++)
					if (_this.data.elements[i].name != ''){
						if (_this.data.elements[i].type == "checkbox")
							params += _this.data.elements[i].checked ? (params == '' ? '' : '&') + _this.data.elements[i].name + '=on' : '';
						else if (_this.data.elements[i].type == "radio")
							params += _this.data.elements[i].checked ? (params == '' ? '' : '&') + _this.data.elements[i].name + '=' + encodeURIComponent(_this.data.elements[i].value) : '';
						else
							params += (params == '' ? '' : '&') + _this.data.elements[i].name + '=' + encodeURIComponent(_this.data.elements[i].value);
					}
				this.xmlhttp.setRequestHeader("content-type", "application/x-www-form-urlencoded");
			}
			else if (_this.data.constructor.name == 'FormData'){
				//this.xmlhttp.setRequestHeader("content-type", "application/x-www-form-urlencoded");
				params = _this.data;
			}
			else if (typeof _this.data == 'object'){
				params = JSON.stringify(_this.data);
				this.xmlhttp.setRequestHeader("content-type", "application/json");
			}
			else
				params = _this.data;
			//
			this.xmlhttp.send(params);
		}
		else
			this.xmlhttp.send(null);
	};
	var cookies = document.cookie.split(';');
	var csrftoken = false;
	for (var i = 0; i < cookies.length; i++){
		var cookie = cookies[i].trim().split('=');
		if (cookie[0] == 'csrftoken')
			csrftoken = cookie[1];
	}

	// ------------------------------------------------------------------------------------
	//	DOM GEN And Template Engine
	// ------------------------------------------------------------------------------------

	//	Create a Dom Element of given type, innerHTML and options
	this.elem = function(tagname, innerHTML, options){
		let obj = document.createElement(tagname);
		if (typeof innerHTML !== 'undefined' && innerHTML != null && innerHTML != false)
			obj.innerHTML = innerHTML;
		if (typeof options !== 'undefined')
			for (let key in options){
				if (typeof options[key] == 'function')
					obj[key] = options[key];
				else
					obj.setAttribute(key, options[key]);
			}
		return obj;
	};

	//	Read DOM tree and generate JSON
	this.read = function(dom, index){
		let obj = {};
		if (typeof dom == 'string')
			dom = arc.elem('div', dom).childNodes[0];
		if (typeof index == 'undefined')
			var index = {};
		for (let i = 0; i < dom.attributes.length; i++){
			obj[dom.attributes[i].name] = dom.attributes[i].value;
			if (dom.attributes[i].value.substring(0, 2) == '{{' && dom.attributes[i].value.substr(-2) == '}}')
				index[dom.attributes[i].value.replace('{{', '').replace('}}', '')] = [obj, dom.attributes[i].name];
		}
		if (dom.children.length == 0){
			obj.content = dom.innerHTML;
			if (dom.innerHTML.substring(0, 2) == '{{' && dom.innerHTML.substr(-2) == '}}')
				index[dom.innerHTML.replace('{{', '').replace('}}', '')] = [obj, 'content'];
		}
		else if (dom.children.length == 1){
			let res = arc.read(dom.children[0], index);
			obj.content = res[0];
		}
		else{
			obj.content = [];
			for (let i = 0; i < dom.children.length; i++){
				let res = arc.read(dom.children[i], index);
				obj.content.push(res[0]);
			}
		}
		let output = {};
		output[dom.tagName.toLowerCase()] = obj;
		return [output, index];
	};

	//	Generate DOM tree from JSON
	this.react = function(data, schema){
		//var arrayIgnore = ['min', 'max', 'sum', 'avg'];
		for (let key in schema[1])
			if (arrayIgnore.indexOf(key) == -1)
				schema[1][key][0][schema[1][key][1]] = data[key];
		return arc.tree(schema[0]);//Object.assign({}, schema)
	};

	//	Generate a DOM tree from a JavaScript object or JSON Schema/Object
	//	This is depricated - Use react instead - which is more efficient.
	this.reactor = function(data){
		let obj;
		for (let tagname in data){
			obj = document.createElement(tagname);
			for (let key in data[tagname]){
				let value = data[tagname][key];
				if (key == 'content'){
					if (typeof value == 'string' || typeof value == 'number')
						obj.innerHTML = value;
					else if (Array.isArray(value))
						for (let i = 0; i < value.length; i++)
							obj.appendChild(arc.reactor(value[i]));			//	Recursion point
					else if (value instanceof HTMLElement)
						obj.appendChild(value);
					else if (typeof value == 'object')
						obj.appendChild(arc.reactor(value));				//	Recursion point
				}
				else if (key.substring(0, 2) == 'on')
					obj[key] = value;				//	Event handler - Sugesstion: Check if a function instead
				else
					obj.setAttribute(key, value);
			}
		}
		return obj;
	};

	//	Generate DOM tree from JSON
	this.tree = function(data){
		let obj;
		for (let tagname in data){
			obj = document.createElement(tagname);
			for (let key in data[tagname]){
				let value = data[tagname][key];
				if (key == 'content'){
					if (typeof value == 'string' || typeof value == 'number')
						obj.innerHTML = value;
					else if (typeof value == 'object')
						if (typeof value.length == 'undefined')
							obj.appendChild(arc.tree(value));
						else
							for (let i = 0; i < value.length; i++)
								obj.appendChild(arc.tree(value[i]));
				}
				else if (typeof value == 'function')
					obj[key] = value;
				else
					obj.setAttribute(key, value);
			}
		}
		return obj;
	};

	//	Generate HTML Table from JSON data and a JSON schema
	this.tbl = function(data, schema){
		let table = elem('table', false, {class: 'table-striped', width: '100%'});
		let tr = table.appendChild(elem('tr', false, {'data-id': 'head'}));
		for (let i = 0; i < schema.length; i++){
			if (typeof schema[i].type != 'undefined'){
				if (schema[i].type == 'numeric')
					tr.appendChild(elem('th', schema[i].title, {align: 'right'}));
				else
					tr.appendChild(elem('th', schema[i].title));
			}
			else
				tr.appendChild(elem('th', schema[i].title));
		}
		let tmp;
		for (let i = 0; i < data.length; i++){
			tr = table.appendChild(elem('tr', false, {'data-id': (data[i].id != undefined ? data[i].id : '')}));
			for (let j = 0; j < schema.length; j++){
				tmp = data[i][schema[j].name];
				if (schema[j]['enum'] != undefined && typeof schema[j]['enum'][tmp] != 'undefined')
					tmp = schema[j]['enum'][tmp];
				if (typeof schema[j].type != 'undefined'){
					if (schema[j].type == 'numeric')
						tr.appendChild(elem('td', tmp+'&nbsp;', {align: 'right'}));
					else
						tr.appendChild(elem('td', tmp+'&nbsp;'));
				}
				else
					tr.appendChild(elem('td', tmp+'&nbsp;'));
			}
		}
		return table;
	};

})(document);


// ------------------------------------------------------------------------------------

Date.prototype.sqlFormatted = function() {
	var yyyy = this.getFullYear().toString();
	var mm = (this.getMonth()+1).toString();
	var dd  = this.getDate().toString();
	return yyyy +'-'+ (mm[1]?mm:"0"+mm[0]) +'-'+ (dd[1]?dd:"0"+dd[0]);
};


// ---------------------------------------------------------------------

HTMLElement.prototype.addClass = function(classname){
	this.className = this.className.replace(new RegExp(classname, 'g'), '').trim()+' '+classname;
};

HTMLElement.prototype.removeClass = function(classname){
	this.className = this.className.replace(new RegExp(classname, 'g'), '').trim();
};

HTMLElement.prototype.a = function(obj){
	return this.appendChild(obj);
};

HTMLElement.prototype.q = function(selector){
	return this.querySelectorAll(selector);
};

HTMLElement.prototype.__defineGetter__("innerText", function () {
	if (this.textContent) {
		return this.textContent;
	}
	else {
		var r = this.ownerDocument.createRange();
		r.selectNodeContents(this);
		return r.toString();
	}
});

function q(selector){
	return document.querySelectorAll(selector);
}

String.prototype.hash = function() {
	var hash = 0, i, chr;
	if (this.length === 0)
		return hash;
	for (i = 0; i < this.length; i++) {
		chr   = this.charCodeAt(i);
		hash  = ((hash << 5) - hash) + chr;
		hash |= 0;
	}
	return hash;
};

// ---------------------------------------------------------------------

var GET = 'GET', POST = 'POST';
var module = {'exports': {}};

var isNumeric = isNumber = function(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
};

var isSet = isset = function(obj) {
	return typeof obj != 'undefined';
};


//	In a better world - we can drop the following..
//	Some cross browsere stuff

if ('ab'.substr(-1) != 'b'){
	String.prototype.substr = function(substr){
		return function(start, length){
			return substr.call(this, start < 0 ? this.length + start : start, length)
		}
	}(String.prototype.substr);
}

if (!String.prototype.trim){
	String.prototype.trim = function (){
		return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
	};
}

// ------------------------------------------------------------------------------------

if (navigator.appName == 'testKit')
	module.exports = arc;
/*else{
	setTimeout(console.log('%c{ArcReactor.js}', 'font-weight:bold; font-size:14pt; color:#204080;'), 10);
	setTimeout(console.log('Loaded and Ready...\n\n'), 10);
	setTimeout(console.log('%cThis is a browser feature intended for developers. Do not paste code you receive from strangers here.', 'color:#A84040;'), 10);
}*/
