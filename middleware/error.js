const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.render('error', {
    title: 'Error',
    error: err.message,
  });
};

const notFound = (req, res, next) => {
  res.status(404);
  res.render('404', {
    title: 'Page Not Found',
  });
};

module.exports = { errorHandler, notFound };