'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  return db.removeColumn('private_config_profile', 'mid')
  .then(() => {
    return db.addColumn('module', 'config_id', { 
      type: 'int',
      foreignKey: { name: 'module_profile_fk', table: 'private_config_profile', rules: { onDelete: 'SET NULL', onUpdate: 'RESTRICT'}, mapping: 'id' }
    })
  })
};

exports.down = function(db) {
  return db.removeColumn('module', 'config_id')
  .then(() => {
    return db.addColumn('private_config_profile', 'mid', { 
      type: 'int',
      foreignKey: { name: 'profile_module_fk', table: 'private_config_profile', rules: { onDelete: 'SET NULL', onUpdate: 'RESTRICT'}, mapping: 'id' }
    })
  })

};

exports._meta = {
  "version": 1
};
