var request = require('superagent');

module.exports = {
  name: 'is.gd',

  maxChunkSize: 3735,

  URL: 'http://is.gd',

  PREFIX: 'http://example.org/', // TODO: Find shorter URL for less overhead

  put: function(buf, done) {
    request.get(this.URL + '/create.php')
      .query({ format: 'simple' })
      .query({ url: this.PREFIX + buf.toString('base64') })
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
    request.get(self.URL + '/forward.php')
      .query({ format: 'simple' })
      .query({ shorturl: self.URL + '/' + id })
      .end(function(err, res) {
        if (err || res.error)
          done(err || res.error);
        else if (res.text)
          done(null, new Buffer(res.text.slice(self.PREFIX.length), 'base64'));
        else
          done(new Error('no url'));
      });
  }
};
