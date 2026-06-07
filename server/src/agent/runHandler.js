async function runHandler(handler, req) {
  return new Promise((resolve, reject) => {
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      set() {
        return this;
      },
      send(data) {
        resolve({ status: this.statusCode, data });
      },
      json(payload) {
        resolve({ status: this.statusCode, data: payload });
      },
    };

    const next = (err) => {
      if (err?.statusCode) {
        resolve({ status: err.statusCode, data: { message: err.message } });
        return;
      }
      reject(err);
    };

    Promise.resolve(handler(req, res, next)).catch(reject);
  });
}

module.exports = { runHandler };
