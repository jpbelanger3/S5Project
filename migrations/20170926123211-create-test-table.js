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
  return db.runSql(`CREATE TABLE IF NOT EXISTS test (id SERIAL PRIMARY KEY, test_text TEXT)`)
  .then(() => {
    return db.runSql(`INSERT INTO test (test_text) VALUES ('Hello World!')`)
  })
  
};

exports.down = function(db) {
  db.runSql(`DROP TABLE IF EXISTS test`)
};

exports._meta = {
  "version": 1
};
