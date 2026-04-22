class BaseService {
  constructor() {
    if (this.constructor === BaseService) {
      throw new Error('BaseService is an abstract class.');
    }
  }
}

module.exports = BaseService;
