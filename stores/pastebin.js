var request = require('superagent');

module.exports = {
  name: 'Pastebin.com',

  maxChunkSize: 384000,

  URL: 'http://pastebin.com',
  API_KEY: '8d61067ca91f8e568421a6c49363dc37',

  put: function(buf, done) {
    request.post(this.URL + '/api/api_post.php')
      .type('form')
      .send({
        api_dev_key: this.API_KEY,
        api_option: 'paste',
        api_paste_private: 1, // Unlisted
        api_paste_code: buf.toString('base64')
      })
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
    request.get(this.URL + '/raw.php')
      .query({ i: id })
      .end(function(err, res) {
        if (err || res.error)
          done(err || res.error);
        else if (res.text)
          done(null, new Buffer(res.text, 'base64'));
        else
          done(new Error('no paste text'));
      });
  }
};
