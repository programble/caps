var request = require('superagent');

module.exports = {
  URL: 'https://api.github.com',

  put: function(buf, done) {
    request.post(this.URL + '/gists')
      .send({
        files: {
          base64: {
            content: buf.toString('base64')
          }
        }
      })
      .on('error', done)
      .end(function(res) {
        if (res.body.id)
          done(null, res.body.id);
        else
          done(new Error('no id'));
      });
  },

  get: function(id, done) {
    request.get(this.URL + '/gists/' + id)
      .on('error', done)
      .end(function(res) {
        if (res.body.files && res.body.files.base64 && res.body.files.base64.content)
          done(null, new Buffer(res.body.files.base64.content, 'base64'));
        else
          done(new Error('no content'));
      });
  }
};
