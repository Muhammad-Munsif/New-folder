// errorMiddleware.js
const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Not Found - ${req.originalUrl}`));
};
const errorHandler = (err, req, res, next) => {
  const statusCode =
    err.name === 'ValidationError' || err.name === 'CastError'
      ? 400
      : err.code === 11000
        ? 409
        : res.statusCode === 200
          ? 500
          : res.statusCode;

  if (statusCode >= 500) console.error(err);
  res.status(statusCode).json({ message: err.message });
};
module.exports = { notFound, errorHandler };