const express = require('express');
const app = express();

const httpProxy = require('http-proxy');
const proxy = httpProxy.createProxyServer({});

app.use(function(err, req, res, next) {
  res.status(503).send(JSON.stringigy(err));
});

app.use(function delay(req, res, next) {
  setTimeout(next, Math.random() * 3000);
});

app.use(function internalError(req, res, next) {
  // if (Math.random() > 0.8) {
  if (false) {
    res.status(500).send({
      status: 500,
      message: 'internal error',
      type:'internal'
    });
  } else {
    next();
  }
});

app.all('/*', function(req, res) {
  proxy.web(req, res, {
    target: 'https://sdk-aws-staging.split.io',
    secure: false,
    changeOrigin: true
  });
});

app.listen(3000, function () {
  console.log('Crazy proxy at 3000 port');
});
