class BaseController {
  constructor() {
    if (this.constructor === BaseController) {
      throw new Error('BaseController is an abstract class.');
    }
  }

  sendSuccess(res, data, statusCode = 200) {
    const serialized = this.serialize(data);
    return res.status(statusCode).json(serialized);
  }

  serialize(data) {
    if (!data) return data;
    if (Array.isArray(data)) {
      return data.map(item => this.serialize(item));
    }
    if (typeof data === 'object' && data !== null) {
      // If it's a Mongoose document, we can convert to JSON which triggers our transforms
      let obj = typeof data.toJSON === 'function' ? data.toJSON() : { ...data };
      if (obj._id && !obj.id) {
        obj.id = obj._id.toString();
      }
      return obj;
    }
    return data;
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
