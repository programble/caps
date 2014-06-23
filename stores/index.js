// Order of this array MUST remain stable. New stores should be added to the
// end. Removed stores should be replaced by null.

module.exports = [
  require('./gist'),
  require('./imgur'),
  require('./refheap'),
  require('./sprunge'),
  require('./isgd'),
  require('./vgd'),
  require('./pastebin'),
  require('./dagd'),
  require('./mediacrush')
];

for (var i = 0; i < module.exports.length; i++)
  if (module.exports[i])
    module.exports[i].id = i;
