/**
 * Module dependencies
 */

var Query = require('../../Query');



/**
 * `Relation.prototype.update()`
 *
 * @return {Query}
 */
module.exports = function update ( /* criteria, values, callback */ ) {

  // ****************************************
  // TODO: normalize usage/arguments
  var criteria = arguments[0];
  var values = arguments[1];
  var callback = arguments[2];
  // ****************************************


  // Instantiate a Query
  var query = this.query({

    adapterMethod: '_updateRaw',

    values: values,

    criteria: criteria

  });


  // // If `criteria` was specified, it's like calling the relevant
  // // Query modifier method(s) immediately.
  // if (criteria) {
  //   query.options({ criteria: criteria });
  // }

  // // If `values` was specified, it's like calling the relevant
  // // Query modifier method(s) immediately.
  // if (values) {
  //   query.options({ values: values });
  // }

  // If `callback` was specified, call `.exec()` immediately.
  if (callback) {
    query.exec(callback);
  }

  return query;
};
