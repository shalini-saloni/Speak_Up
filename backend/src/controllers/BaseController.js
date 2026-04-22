class BaseController {
  constructor() {
    if (this.constructor === BaseController) {
      throw new Error('BaseController is an abstract class.');
    }
  }

  sendSuccess(res, data, statusCode = 200) {
    return res.status(statusCode).json(data);
  }

  sendError(res, message, statusCode = 500) {
    return res.status(statusCode).json({ error: message });
  }

  handleError(res, error) {
    console.error(`[Controller Error]`, error);
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    return this.sendError(res, message, statusCode);
  }
}

module.exports = BaseController;
