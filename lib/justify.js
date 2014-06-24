module.exports = {
  left: function(str, len, pad) {
    str = '' + str;
    while (str.length < len) str += pad || ' ';
    return str;
  },
  right: function(str, len, pad) {
    str = '' + str;
    while (str.length < len) str = (pad || ' ') + str;
    return str;
  }
};
