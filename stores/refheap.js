var request = require('superagent');

module.exports = {
  name: 'Refheap',

  maxChunkSize: 460797, // 614396 bytes of base64-encoded data

  URL: 'https://www.refheap.com/api',

  put: function(buf, done) {
    request.post(this.URL + '/paste')
      .type('form')
      .send({ private: true })
      .send({ contents: buf.toString('base64') })
      .end(function(err, res) {
        if (err || res.error)
          done(err || res.error);
        else if (res.body['paste-id'])
          done(null, res.body['paste-id']);
        else
          done(new Error('no paste id'));
      });
  },

  get: function(id, len, done) {
    request.get(this.URL + '/paste/' + id).end(function(err, res) {
      if (err || res.error)
        done(err || res.error);
      else if (res.body.contents)
        done(null, new Buffer(res.body.contents, 'base64'));
      else
        done(new Error('no paste contents'));
    });
  }
};
