const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://localhost:5000",
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, res) => {
        console.log('🔍 Proxy request:', req.method, req.url);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('🔍 Proxy response:', proxyRes.statusCode, req.url);
      },
      onError: (err, req, res) => {
        console.error('🔍 Proxy error:', err.message);
      }
    })
  );
};
