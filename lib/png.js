var PNG = require('node-png').PNG;

module.exports = {
  encode: function(data, done) {
    // 1 pixel = 4 bytes (RGBA). Create a square PNG large enough to fit data
    // as pixel data.
    var size = Math.ceil(Math.sqrt(data.length / 4));
    var png = new PNG({ width: size, height: size });

    // Copy data to PNG pixel data
    data.copy(png.data);

    // Read PNG data into a new buffer
    var chunks = [];
    png.pack();
    png.on('data', function(chunk) {
      chunks.push(chunk);
    });
    png.on('end', function() {
      done(null, Buffer.concat(chunks));
    });
  },

  decode: function(pngData, len, done) {
    // Parse the PNG data
    var png = new PNG();
    png.parse(pngData, function(err) {
      if (err) return done(err);

      // Return the pixel data buffer
      done(null, png.data.slice(0, len));
    });
  }
};
