/**
 * Module dependencies
 */

var util = require('util');
var _ = require('lodash');



/**
 * WLError
 *
 * All errors passed to a query callback in Waterline extend
 * from this base error class.
 *
 * @param  {Object} properties
 * @constructor {WLError}
 */
function WLError( properties ) {

  // Normalize constructor arguments
  if ( !_.isObject(properties) ) {
    properties = { reason: properties };
  }
  else if (!properties.code && !properties.originalError) {
    properties = _.merge(properties, { originalError: properties });
  }

  // Call super constructor (Error)
  WLError.super_.call(this);

  // Fold defined properties into the new WLError instance.
  properties = properties||{};
  _.extend(this, properties);

  // If `originalError` is already a WLError (or really looks like one)
  // just return that.
  if (_.isObject(this.originalError) && (
    this.originalError instanceof WLError ||
    this.originalError.constructor.name === 'WLError' ||
    this.originalError.constructor.name === 'WLUsageError' ||
    this.originalError.constructor.name === 'WLValidationError'
  )) {
    return this.originalError;
  }

  // Generate stack trace
  // (or use `originalError` if it is a true error instance)
  if (_.isObject(this.originalError) && this.originalError instanceof Error) {
    this._e = this.originalError;
  }
  else this._e = new Error();

  // Doctor up a modified version of the stack trace called `rawStack`:
  this.rawStack = (this._e.stack.replace(/^Error(\r|\n)*(\r|\n)*/, ''));

  // Expose the stack trace as `this.stack`
  this.stack = this.code + ' :: ' + this.message + '\n' + this.rawStack;


  // Customize `details`:
  // Try to dress up the wrapped "original" error as much as possible.
  // @type {String} a detailed explanation of this error
  if (typeof this.originalError === 'string') {
    this.details = this.originalError;
  }
  // Run toString() on Errors:
  else if ( this.originalError && util.isError(this.originalError) ) {
    this.details = this.originalError.toString();
  }
  // But for other objects, use util.inspect()
  else if (this.originalError) {
    this.details = util.inspect(this.originalError);
  }

  // If `details` is set, prepend it with "Details:"
  if (this.details) {
    this.details = 'Details:  '+this.details +'\n';
  }

}
util.inherits(WLError, Error);


// Default properties
WLError.prototype.status =
500;
WLError.prototype.code =
'E_UNKNOWN';
WLError.prototype.reason =
'Encountered an unexpected error';
WLError.prototype.details =
'';


/**
 * `.message` and `.stack`
 *
 * Because some tools/apps (*cough* mocha) try to call `.message`
 * and/or `.stack()` on things that look like standard JavaScript
 * Errors, but really aren't.
 *
 * @return {String} the toString() output of this error
 */

WLError.prototype.__defineGetter__('message', function(){
  return this.toString();
});


/**
 * Override JSON serialization.
 * (i.e. when this error is passed to `res.json()` or `JSON.stringify`)
 *
 * For example:
 * ```json
 * {
 *   status: 500,
 *   code: 'E_UNKNOWN'
 * }
 * ```
 *
 * @return {Object}
 */
WLError.prototype.toJSON =
WLError.prototype.toPOJO =
function () {
  var obj = {
    error: this.code,
    status: this.status,
    summary: this.reason,
    raw: this.originalError
  };

  // Only include `raw` if its truthy.
  if (!obj.raw) delete obj.raw;

  return obj;
};



/**
 * Override output for `sails.log[.*]`
 *
 * @return {String}
 *
 * For example:
 * ```sh
 * Waterline: ORM encountered an unexpected error:
 * { ValidationError: { name: [ [Object], [Object] ] } }
 * ```
 */
WLError.prototype.toLog = function () {
  return this.inspect();
};


/**
 * Override output for `util.inspect`
 * (also when this error is logged using `console.log`)
 *
 * @return {String}
 */
WLError.prototype.inspect = function () {
  return util.format('Error (%s) :: %s\n%s\n\n%s', this.code, this.reason, this.rawStack, this.details);
};



/**
 * @return {String}
 */
WLError.prototype.toString = function () {
  return util.format('[Error (%s) %s]', this.code, this.reason, this.details);
};



module.exports = WLError;
