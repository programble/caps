var stores = [];
module.exports = Stores = function(i) {
  return stores[i];
};

// Indices must remain stable. New stores should be added to the end. An empty
// item should be left in place of a removed store.

stores[0] = Stores.gist    = require('./gist');
stores[1] = Stores.sprunge = require('./sprunge');
stores[2] = Stores.refheap = require('./refheap');
stores[3] = Stores.isgd    = require('./isgd');
stores[4] = Stores.vgd     = require('./vgd');
