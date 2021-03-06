/**
 * Module dependencies
 */

var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');

var WLUsageError = require('root-require')('standalone/WLError/WLUsageError');
var prettyInstance = require('root-require')('standalone/pretty-instance');


/**
 * Construct a QueryHeap.
 *
 * QueryHeap instances are used for storing and emitting results
 * from the query engine (i.e. criteria cursor).  If streaming,
 * when the data necessary to form a complete Record is ready, it
 * is immediately emitted for integration, instantiation, and output.
 * Otherwise, if the output spans multiple datastores AND must be sorted,
 * the QueryHeap waits until an entire result set is ready, then emits it
 * to the integrator, which instantiates a RecordCollection and returns
 * it to the user via a promise/callback.
 *
 * (TODO:)
 * In the latter case, it is the responsibility of the QueryHeap to
 * warn about the possibility of reaching excessive memory usage for a
 * single query before reaching a critical crash scenario.  For now,
 * this is enforced as a basic max limit on sorted result sets that
 * span multiple datastores.
 *
 * > Note:
 * >
 * > In some ways, you can think about a QueryHeap a bit like a SQL view,
 * > or "relvar".  It tracks order, but still must be integrated before
 * > it can be used directly in the normal, expected way (as an ordered
 * > result set of objects, potentially with populated data in each one)
 *
 * @constructor
 * @extends {EventEmitter}
 */

function QueryHeap (opts) {

  // Make `this.orm` non-enumerable
  Object.defineProperty(this, 'orm', { enumerable: false, writable: true });
  // Make `this._buffers` non-enumerable
  Object.defineProperty(this, '_buffers', { enumerable: false, writable: true });

  // Build initial set of buffers.
  this._buffers = {};
  // TODO:
  // Store these buffers in an adapter so that they may also be paged through
  // since it is possible to overflow RAM since the # of buffers is infinite
  // (this can be mitigated by using ephemeral buffers for subqueries)


  // TODO:
  // Create the notion of ephemeral buffers for subqueries/aggregations


  // TODO:
  // Store the contents of buffers in an adapter (even footprints) so they
  // can be

  // TODO:
  // track already-matched records in a buffer (that can overflow to an adapter, again)
  // to provide an optimization in subquery cursor (do NOTIN queries)


  // Merge all opts into `this` context.
  _.merge(this, opts || {});

  if (!this.orm) {
    throw new WLUsageError('An `orm` is required when initializing a QueryHeap');
  }

  // Enforced by QH:
  // this.sort;
  // this.limit;

  // Ignored in QH for now:
  // this.where;
  // this.select;
  // this.skip;

}
util.inherits(QueryHeap, EventEmitter);


// Integrator
QueryHeap.prototype.integrate = require('./QueryHeap.prototype.integrate');

// Extend the records in the buffer with the specified `bufferIdent` with the provided data.
QueryHeap.prototype.rehydrate = require('./QueryHeap.prototype.rehydrate');

// Saves new records to an existing page buffer
QueryHeap.prototype.push = require('./QueryHeap.prototype.push');

QueryHeap.prototype.pushFootprints = function (bufferIdent, records) {
  this.push(bufferIdent, records, true);
};

// Gets all records from the specified page buffer
QueryHeap.prototype.get = require('./QueryHeap.prototype.get');

// Allocates a new page buffer with the specified properties
QueryHeap.prototype.malloc = require('./QueryHeap.prototype.malloc');

// Releases the memory for a page buffer
QueryHeap.prototype.heap = require('./QueryHeap.prototype.free');

// Aggregates and returns all records from the specified relation
QueryHeap.prototype.getAllFrom = function (relationIdentity, relationPK){
  return _.uniq(_.reduce(this._buffers, function (memo, buffer, bufferIdent) {
    if (buffer.from.identity === relationIdentity) {
      memo.push.apply(memo, buffer.records);
    }
    return memo;
  }, []), relationPK);
};

// Return all buffers whose identity matches the specified regular expression
QueryHeap.prototype.getBufferIdentitiesLike = function (rxp) {
  return _(this._buffers).keys().where(function (bufferIdent) {
    return bufferIdent.match(rxp);
  }).valueOf();
};



////////////////////////////////////////////////////////////////////////////////////
// TODO: Global Caching
////////////////////////////////////////////////////////////////////////////////////
// TODO:
// QueryHeap should extend from WLHeap - which can also be used as a cross-query cache

// TODO:
// Merge the buffers of `someOtherHeap` into this heap (union)
// QueryHeap.prototype.merge(someOtherHeap)

// TODO:
// Free all buffers in this heap
// QueryHeap.prototype.freeAll()
////////////////////////////////////////////////////////////////////////////////////


// Presentation
QueryHeap.prototype.inspect = function () {
  return prettyInstance(this, {
    _buffers: this._buffers
  });
};

module.exports = QueryHeap;
