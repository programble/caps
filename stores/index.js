var _ = require('lodash');

function Stores() {
  return _(Stores).values().sortBy('id').value();
}

_.assign(Stores, {
  gist:     require('./gist'),
  imgur:    require('./imgur'),
  refheap:  require('./refheap'),
  sprunge:  require('./sprunge'),
  isgd:     require('./isgd'),
  vgd:      require('./vgd'),
  pastebin: require('./pastebin')
});

Stores.gist.id     = 0;
Stores.imgur.id    = 5;
Stores.refheap.id  = 10;
Stores.sprunge.id  = 15;
Stores.isgd.id     = 20;
Stores.vgd.id      = 21;
Stores.pastebin.id = 25;

module.exports = Stores;
