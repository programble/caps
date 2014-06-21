var stores = [];
module.exports = Stores = function(i) {
  return stores[i];
};

// Order must remain stable, as we index into this array. New stores should be
// added to the end. When stores are removed they should be replaced by a null.

stores.push(Stores.gist    = require('./gist'));
stores.push(Stores.refheap = require('./refheap'));
stores.push(Stores.sprunge = require('./sprunge'));
