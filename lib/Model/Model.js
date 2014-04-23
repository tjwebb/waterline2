/**
 * Module dependencies
 */

var _ = require('lodash');
_.defaults = require('merge-defaults');
var prettyInstance = require('../../util/prettyInstance');


/**
 * Construct a Model.
 * (aka "Collection")
 *
 * Each Model instance starts off with a `definition`, which typically
 * includes the identity of the Database where its records are stored,
 * as well as one or more attribute(s) and other properties like `schema`.
 * The initial options should be passed down by the ORM instance this
 * Model belongs to.
 *
 * @constructor
 * @param {Object} definition
 *                    -> orm: {ORM}
 *                    -> attributes: {Object}
 *                    -> ...
 */

function Model (definition) {
  definition = definition || {};
  _.defaults(definition, {
    attributes: {}
  });

  // Merge properties into the Model instance itself,
  // unless they are already defined.
  _.defaults(this, definition);

}


/**
 * Refresh this model's associations (i.e. keys/junctions/associated models)
 *
 * @chainable
 * @return {Model}
 */
Model.prototype.refresh = function () {

  // Closure access to `orm`,`identity`,etc. for use below
  var orm = this.orm;
  var identity = this.identity;
  var self = this;

  // TODO: get actual primary key, etc. from waterline-schema
  // (already using it in `ORM.prototype.refresh()`)
  this.primaryKey = 'id';

  // TODO: use waterline-schema for this
  this.associations = _.reduce(this.attributes, function (memo, attrDef, attrName) {
    if (_.isObject(attrDef) && attrDef.model || attrDef.collection) {

      var relatedIdentity = attrDef.model || attrDef.collection;
      var relatedModel = orm.model(relatedIdentity);

      // Skip this association if the model doesn't exist yet
      // (fails silently)
      if (!relatedModel) return memo;

      // Build association def
      var assoc = {
        // The `target` is the model or junction which is
        // the target of our population.
        target: relatedModel,

        // The `keeper` is the model or junction which
        // _actually has_ (or "keeps") the foreign key(s).
        keeper: null,

        // This object has a key for each model that is _pointed to_.
        // That is, these foreign keys are named for the model to
        // which they _point_, NOT the model in which they _reside_.
        foreignKeys: {}
      };

      // TODO: get junction (from WLSchema)
      var junction;


      // One-way "hasOne" association
      if (attrDef.model) {
        assoc.type = '1-->N';
        assoc.cardinality = 1;
        assoc.oneway = true;
        assoc.keeper = self;
        assoc.foreignKeys[relatedIdentity] = attrName;
      }
      // One-way "hasMany" association
      else if (attrDef.collection && !attrDef.via) {
        assoc.type = 'N-->M';
        assoc.cardinality = 'n';
        assoc.oneway = true;
        assoc.keeper = junction;
        assoc.foreignKeys[identity] = junction.foreignKeys[identity];
        assoc.foreignKeys[relatedIdentity] = junction.foreignKeys[relatedIdentity];
      }
      // Two-way "belongsToMany" association
      else if (
        attrDef.collection && attrDef.via &&
        relatedModel.attributes[attrDef.via] &&
        relatedModel.attributes[attrDef.via].model
      ) {
        assoc.type = 'N<->1';
        assoc.cardinality = 'n';
        assoc.oneway = false;
        assoc.keeper = relatedModel;
        assoc.foreignKeys[identity] = attrDef.via;
      }
      // Two-way "hasMany" association
      else if (
        attrDef.collection && attrDef.via &&
        relatedModel.attributes[attrDef.via] &&
        relatedModel.attributes[attrDef.via].collection &&
        relatedModel.attributes[attrDef.via].via === attrName
      ) {
        assoc.type = 'N<->M';
        assoc.cardinality = 'n';
        assoc.oneway = false;
        assoc.keeper = junction;
        assoc.foreignKeys[identity] = junction.foreignKeys[identity];
        assoc.foreignKeys[relatedIdentity] = junction.foreignKeys[relatedIdentity];
      }

      // var isManyToMany = assoc.type === 'N<->M' || assoc.type === 'N-->M';
      // console.log('ASSOC ('+identity+'.'+attrName+'):::',assoc);

      memo[attrName] = assoc;
    }
    return memo;
  }, {});

  return this;
};


/**
 * Look up the live Adapter instance for this Model's Database.
 *
 * @return {Adapter}
 */
Model.prototype.getAdapter = function () {
  try {
    var database = _.find(this.orm.databases, { identity: this.database });
    var adapter = _.find(this.orm.adapters, { identity: database.adapter });
    return adapter;
  }
  catch (e) {
    return null;
  }
};

/**
 * Look up the live Database instance for this Model.
 *
 * @return {Database}
 */
Model.prototype.getDatabase = function () {
  try {
    var database = _.find(this.orm.databases, { identity: this.database });
    return database;
  }
  catch (e) {
    return null;
  }
};


/**
 * Return self
 *
 * @return {Model}
 */
Model.prototype.getModel = function () { return this; };

// Base query method
// (constructs a generic Waterline Query pointed at this model)
Model.prototype.query = require('./query');

// Base CRUD methods
Model.prototype.find = require('./find');
Model.prototype.create = require('./create');
Model.prototype.update = require('./update');
Model.prototype.destroy = require('./destroy');

// Convenience methods
Model.prototype.findOne = require('./findOne');

// Compound methods
Model.prototype.findOrCreate = require('./findOrCreate');
Model.prototype.updateOrCreate = require('./updateOrCreate');

// DDL methods
Model.prototype.describe = require('./describe');
Model.prototype.drop = require('./drop');
Model.prototype.addAttr = require('./addAttr');
Model.prototype.removeAttr = require('./removeAttr');

// Presentation
Model.prototype.inspect = function () {
  return prettyInstance(this, {
    attributes: this.attributes
  }, 'Model <'+(this.globalID || this.identity)+'>');
};


module.exports = Model;