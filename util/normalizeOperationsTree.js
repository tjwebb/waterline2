/**
 * Module dependencies
 */

var util = require('util');
var _ = require('lodash');
_.defaults = require('merge-defaults');
var WLUsageError = require('../lib/WLError/WLUsageError');



/**
 * normalizeOperationsTree()
 *
 * @param  {Object} operationsTree
 * @param  {ORM} orm              [required for non-object, primary key usage in WHERE clause]
 * @return {Object}
 * @api private
 */
function normalizeOperationsTree (operationsTree, orm) {

  // console.log('Attempting to normalize operationsTree:', operationsTree);

  // Ensure `operationsTree` is an object
  if (!_.isObject(operationsTree)) {

    // If not an object, try to interpret some meaning out of it
    if (operationsTree === false) {
      operationsTree = { where: false };
    }
    // If true, null or undefined, interpret this as an empty object
    // (i.e. find all the things)
    else if (operationsTree === undefined || operationsTree === null || operationsTree === true) {
      operationsTree = { where: {} };
    }
    // Otherwise, assume it represents a desired primary key value:
    else {
      var desiredPkValue = operationsTree;
      operationsTree = { where: desiredPkValue };
    }
  }


  // Check if the tree contains any operations modifiers
  var operationModifiers = _.intersection(OPERATION_MODS, Object.keys(operationsTree));

  // If it doesn't, we'll assume all of the keys belong to a "WHERE"
  if (!operationModifiers.length) {
    operationsTree = {where: operationsTree};
  }

  // Normalize SORT
  if (_.isString(operationsTree.sort)) {
    // TODO
  }

  operationsTree = _.defaults(operationsTree, {
    select: {},
    where: {},
    limit: 30,
    skip: 0,
    sort: {}
  });


  // As soon as possible, store the target model for this query in this variable.
  // It may be accessed via closure scope throughout this normalization utility.
  var targetModel;
  if (operationsTree.from && orm) {
    targetModel = orm.model(operationsTree.from);
  }


  // Now recursively normalize the other bits
  return _.reduce(operationsTree, function (memo, sub, key) {

    if (key === 'where') {
      memo.where = normalizeWhereTree(sub);
    }
    else if (key === 'select') {
      memo.select = normalizeSelectTree(sub);
    }
    else {
      memo[key] = sub;
    }
    return memo;
  }, {});
}


/**
 * [normalizeWhereTree description]
 * @param  {[type]} whereTree [description]
 * @return {[type]}           [description]
 */
function normalizeWhereTree (whereTree) {

  // Handle the non-object case in where criteria (`false`)
  // Short-circuit
  if (!_.isObject(whereTree) && whereTree === false) {
    return false;
  }
  // Since its not a criteria object, the `whereTree` value must represent a
  // desired primary key value.  If we were able to definitively infer a model
  // at some point when parsing this query, we should use its primary key to
  // build the appropriate criteria object.
  else if (!_.isObject(whereTree) && targetModel) {
    var desiredPkValue = whereTree;
    var assumedWhereCriteria = {};
    assumedWhereCriteria[targetModel.primaryKey] = desiredPkValue;
    return assumedWhereCriteria;
  }
  // If we're at a loss, and no ORM was passed in, throw an error
  // (this is safe because the only way that woudl happen is in the event of
  //  a serious bug, or if this normalization module was being used independently,
  //  in which case a thrown error is the most conventional/descriptive strategy.)
  else if (!_.isObject(whereTree)) {
    throw new WLUsageError('Could not parse/normalize part of the `where` criteria: '+util.inspect(whereTree));
  }

  // Check if this level of the tree contains any operations modifiers
  var operationModifiers = _.intersection(OPERATION_MODS, Object.keys(whereTree));
  if (operationModifiers.length) {
    throw new WLUsageError('Invalid operations syntax in query. Should not specify modifiers (e.g. `where` or `limit`) inside of a `where` clause.  To do a nested `where` (i.e. subquery) on an association, use the `whose`, `min`, and/or `max` subquery modifiers.');
  }

  // Now loop through each attribute/association
  return _.reduce(whereTree, function (memo, sub, attrName) {

    // If this is not a subtree, get out
    if (_.isArray(sub) || !_.isObject(sub)) {
      memo[attrName] = sub;
      return memo;
    }

    // Check if the subtree contains any operations modifiers
    var operationModifiers = _.intersection(OPERATION_MODS, Object.keys(sub));
    if (operationModifiers.length) {
      throw new WLUsageError('Invalid operations syntax in query. Should not specify modifiers (e.g. `where` or `limit`) inside of a `where` clause.  To do a nested `where` (i.e. subquery) on an association, use the `whose`, `min`, and/or `max` subquery modifiers.');
    }

    // Check if the subtree contains any subattribute modifiers
    var subattrModifiers = _.intersection(SUBATTR_MODS, Object.keys(sub));
    // If it does, get out, it's ok.
    if (subattrModifiers.length) {
      memo[attrName] = sub;
      return memo;
    }

    // Check if the subtree contains any subquery modifiers
    var subqueryModifiers = _.intersection(SUBQUERY_MODS, Object.keys(sub));

    // If it doesn't, we'll assume all of the keys belong to a "WHOSE", with "MIN:1"
    if (!subqueryModifiers.length) {
      sub = { whose: sub, min: 1 };
    }

    // Now validate/normalize subquery modifier subtrees
    if (sub.whose) {
      sub.whose = normalizeWhereTree(sub.whose);
    }
    if (sub.min) {
      // TODO: validate MIN
      sub.min = sub.min;
    }
    if (sub.max) {
      // TODO: validate MAX
      sub.max = sub.max;
    }

    memo[attrName] = sub;
    return memo;
  }, {});
}




/**
 * [normalizeSelectTree description]
 * @param  {[type]} selectTree [description]
 * @return {[type]}            [description]
 */
function normalizeSelectTree (selectTree) {

  // Check if this level of the tree contains any operations modifiers
  var operationModifiers = _.intersection(OPERATION_MODS, Object.keys(selectTree));
  if (operationModifiers.length) {
    throw new WLUsageError('Invalid operations syntax in query. Should not specify modifiers (e.g. `where` or `limit`) inside of a `select` clause.  However, you _can_ use these modifiers within an _association_ of a `select` clause.  For example: {select: { name: true, pet: { where: { age: { ">": 12 } } } } }');
  }

  // Now loop through each attribute/association
  return _.reduce(selectTree, function (memo, sub, attrName) {

    // If this is not a subtree, get out
    if (_.isArray(sub) || !_.isObject(sub)) {
      memo[attrName] = sub;
      return memo;
    }

    // Check if the subtree contains any operations modifiers
    var operationModifiers = _.intersection(OPERATION_MODS, Object.keys(sub));

    // If it doesn't, we'll assume all of the keys belong to another "SELECT"
    if (!operationModifiers.length) {
      sub = {select: sub};
    }

    // Now jump back into a recursive normalization
    // (sub-selects are actually full operations trees)
    sub = normalizeOperationsTree(sub);

    memo[attrName] = sub;
    return memo;
  }, {});

}



// Operation clause flags:
var OPERATION_MODS = ['where','select','sort','from','skip','limit'];

// Predicate modifiers
var PREDICATE_MODS = ['or'];

// Subquery modifiers
var SUBQUERY_MODS = ['whose', 'min', 'max'];

// Sub-attribute modifiers
var SUBATTR_MODS = [
  'contains', 'startsWith', 'endsWith',
  'in',
  'lessThan', 'greaterThan', 'equals', 'not', '!', '!=', '>', '<', '>=', '<='
];




module.exports = normalizeOperationsTree;
















// Example ops for reference:
// (people over 40 who have at least two (but no more than three) friends under 30)
// var x = {
//   from: 'person',
//   where: {
//     age: { '>': 40 },
//     friends: {
//       min: 2,
//       max: 3,
//       whose: {
//         age: { '<': 30 }
//       }
//     }
//   },

//   select: {
//     id: true,
//     name: true,
//     friends: {
//       select: {
//         id: true,
//         name: true
//       },
//       limit: 5,
//       skip: 0,
//       sort: 'popularity DESC'
//     }
//   }
// };

