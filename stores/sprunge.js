var request = require('superagent');

module.exports = {
  name: 'sprunge',

  URL: 'http://sprunge.us',

  put: function(buf, done) {
    request.post(this.URL)
      .type('form')
      .send({ sprunge: buf.toString('base64') })
      .end(function(err, res) {
        if (err || res.error)
          done(err || res.error);
        else if (res.text)
          done(null, res.text.trim().split('/').reverse()[0]);
        else
          done(new Error('no url'));
      });
  },

  get: function(id, done) {
    var self = this;
    request.get(self.URL + '/' + id).end(function(err, res) {
      if (err || res.error)
        done(err, res.error);
      else if (res.text)
        done(null, new Buffer(res.text, 'base64'));
      else
        done(new Error('no url'));
    });
  }
};
