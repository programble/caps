var request = require('superagent');
var FormData = require('form-data');

var PNG = require('../lib/png');

module.exports = {
  name: 'mediacrush',

  URL: 'https://mediacru.sh',

  put: function(buf, done) {
    var self = this;
    PNG.encode(buf, function(err, png) {
      if (err) return done(err);
      var req = request.post(self.URL + '/api/upload/file');

      // HACK: So that the image/png Content-Type is actually sent
      req._formData = new FormData();
      req._formData.append('file', png, {
        filename: 'chunk.png',
        contentType: 'image/png'
      });

      req.end(function(err, res) {
        if (err || res.error && res.status != 409)
          done(err || res.error);
        else if (res.body.hash)
          done(null, res.body.hash);
        else
          done(new Error('no hash'));
      });
    });
  },

  get: function(id, len, done) {
    request.get(this.URL + '/' + id + '.png').end(function(err, res) {
      if (err || res.error)
        return done(err || res.error);

      var chunks = [];
      res.on('data', function(chunk) {
        chunks.push(chunk);
      });
      res.on('end', function() {
        var png = Buffer.concat(chunks);
        PNG.decode(png, len, done);
      });
    });
  }
};
