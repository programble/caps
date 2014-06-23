var request = require('superagent');

module.exports = {
  name: 'da.gd',

  maxChunkSize: 30570, // Due to header limits

  URL: 'http://da.gd',

  PREFIX: 'http://',

  put: function(buf, done) {
    request.post(this.URL + '/s')
      .type('form')
      .send({ url: this.PREFIX + buf.toString('base64') })
      .end(function(err, res) {
        if (err || res.error)
          done(err || res.error);
        else if (res.text)
          done(null, res.text.trim().split('/').reverse()[0]);
        else
          done(new Error('no url'));
      });
  },

  get: function(id, len, done) {
    var self = this;
    request.get(self.URL + '/s/' + id)
      .redirects(0)
      .end(function(err, res) {
        if (err || res.error) {
          done(err || res.error);
        } else if (res.header.location) {
          var base64 = res.header.location.slice(self.PREFIX.length);
          done(null, new Buffer(base64, 'base64'));
        } else {
          done(new Error('no location'));
        }
      });
  }
};
