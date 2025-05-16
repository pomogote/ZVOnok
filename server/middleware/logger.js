module.exports = (req, res, next) => {
  const start = Date.now();

  // Логирование входящего запроса
  console.log(`[REQUEST] ${req.method} ${req.url}`);

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[RESPONSE] ${req.method} ${req.url} - Status: ${res.statusCode} (${duration}ms)`);
  });

  next();
};