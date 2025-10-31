
const express = require('express');
const receiver = require('./receive');
const dashboard = require('./dashboard');
const repository = require('./repository');
const dbConn = require("./dbConn");
require("dotenv").config({ path: ".env" });
const basicAuth = require("./basicAuth");

const database = new dbConn(console, {
	'host': process.env.DATABASE_HOST.trim(),
	'port' : process.env.DATABASE_PORT.trim(),
	'database': process.env.DATABASE_NAME.trim(),
	'user': process.env.DATABASE_USERNAME.trim(),
	'password': process.env.DATABASE_PASSWORD.trim(),
	'charset': 'utf8mb4'
}, {retryMinTimeout: 2000, retryMaxTimeout: 60000}).connect();

receiver.attach(database, repository);
dashboard.attach(database, repository);

const app = express();
const port = process.env.PORT || 8000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use('/static', express.static('./static'));
app.get('/', basicAuth, dashboard.index);
app.get('/data', basicAuth, dashboard.data);
app.get('/devices', basicAuth, dashboard.devices);
app.get('/per-day', basicAuth, dashboard.perDay);

app.post('/rx', receiver.receive);

app.listen(port, function() {
  console.log('Listening on port', port);
});
