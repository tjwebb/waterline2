/**
 * Module dependencies
 */

var _ = require('lodash');

var prettyInstance = require('root-require')('standalone/pretty-instance');



/**
 * Consruct an Adapter.
 *
 * Mostly a noop, this takes an adapter definition object
 * and constructs an Adapter instance based on it.
 *
 * Currently, the new instance and the adapter definition object
 * are more or less exactly the same thing.
 *
 * @param  {Object} definition
 * @constructor
 */
function Adapter ( definition ) {

  // Make `this.orm` non-enumerable
  Object.defineProperty(this, 'orm', { enumerable: false, writable: true });

  _.merge(this, definition || {});

  // Ensure `apiVersion` string exists-- if not, default to "0.0.0"
  this.apiVersion = this.apiVersion || '0.0.0';
}


// Return a context-dependent (i.e. "this"-dependent) bridge method based on
// the provided `spec` and context (`this`, or `ctxOverride`)
Adapter.bridge = require('./Adapter.bridge');

// Qualifier
Adapter.isAdapter = require('root-require')('standalone/WLEntity').qualifier;


Adapter.prototype.refresh = function () {
  // This is a no-op.  Only exists to avoid throwing when this adapter
  // is treated as a generic WLEntity.
};

// Presentation
Adapter.prototype.inspect = function () {
  return prettyInstance(this, undefined, 'Adapter <'+this.identity+'>');
};


module.exports = Adapter;
