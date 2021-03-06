// 'use strict';

/**
 * Module dependencies
 */

var _ = require('lodash');

var $$ = require('root-require')('standalone/CRITERIA-MODIFIERS');



/**
 * Return a "flattened" WHERE or SELECT clause.
 *
 * (maintains referential transparency- returns a shallow clone)
 *
 * @param {Object} clause
 * @return {Object}
 */
module.exports = function flattenClause(clause) {
  var flattenedClause = _.reduce(clause, function (memo, subObj, attrName) {

    // TODO: expand this check to use the more sophisticated stuff currently located in `normalizeCriteria.js`
    var hasSubAttributeModifier =
    _.isObject(subObj) &&
    _.any(Object.keys(subObj), function (attrName){
      return _.contains(Object.keys($$.SUBATTR_MODS), attrName);
    });

    var isFlat =
    !_.isObject(subObj) ||
    _.isArray(subObj) ||
    hasSubAttributeModifier ||
    _.isDate(subObj) ||
    subObj instanceof Error;

    if (isFlat) {
      memo[attrName] = subObj;
    }
    return memo;
  }, {});
  return flattenedClause;
};


