// --- Basic Auth Middleware ---

module.exports = function basicAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Restricted"');
    return res.status(401).send('Authentication required.');
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');

  const validUser = process.env.DASHBOARD_USER;
  const validPass = process.env.DASHBOARD_PASS;

  if (username === validUser && password === validPass) {
    return next();
  }

  res.setHeader('WWW-Authenticate', 'Basic realm="Restricted"');
  return res.status(401).send('Access denied.');
}
