var request = require('superagent');

var PNG = require('../lib/png');

module.exports = {
  URL: 'https://api.imgur.com/3',
  CLIENT_ID: '53ce0ac961e2fb8',
  IMAGE_URL: 'http://i.imgur.com',

  put: function(buf, done) {
    var self = this;
    PNG.encode(buf, function(err, png) {
      if (err) return done(err);
      request.post(self.URL + '/image')
        .set('Authorization', 'Client-ID ' + self.CLIENT_ID)
        .type('form')
        .send({
          type: 'base64',
          image: png.toString('base64')
        })
        .end(function(err, res) {
          if (err || res.error)
            done(err || res.error);
          else if (res.body.data && res.body.data.id)
            done(null, [ res.body.data.id, buf.length ]);
          else
            done(new Error('no id'));
        });
    });
  },

  get: function(info, done) {
    var id = info[0];
    var len = info[1];
    request.get(this.IMAGE_URL + '/' + id + '.png').end(function(err, res) {
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
