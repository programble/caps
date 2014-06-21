var request = require('superagent');

module.exports = {
  URL: 'http://sprunge.us',

  PREFIX: 'http://example.org/',

  put: function(buf, done) {
    request.post(this.URL)
      .type('form')
      .send({ sprunge: this.PREFIX + buf.toString('base64') })
      .end(function(err, res) {
        if (err || res.error)
          done(err || res.error);
        else if (res.text)
          done(null, res.text.split('/').reverse()[0]);
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
        done(null, new Buffer(res.text.slice(self.PREFIX.length), 'base64'));
      else
        done(new Error('no url'));
    });
  }
};
