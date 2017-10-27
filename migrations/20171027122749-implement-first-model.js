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

  return db.createTable('client', {
    id: { type: 'int', notNull: true, primaryKey: true, autoIncrement: true },
    username: { type: 'string', notNull: true, length: 100 },
    password: { type: 'string', notNull: true, length: 100 },
    created_date: { type: 'timestamp', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') },
    lastseen: { type: 'timestamp', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') },

  }).then(() => {

    return db.createTable('module', {
      id: { type: 'int', notNull: true, primaryKey: true, autoIncrement: true },
      cid: { type: 'int', 
        foreignKey: {
          name: 'module_client_fk',
          table: 'client',
          rules: { onDelete: 'SET NULL', onUpdate: 'RESTRICT'},
          mapping: 'id',
        }
      },
      name: { type:'string', length: 100 },
      last_reading_id: { type: 'int' },
      last_picture_id: { type: 'int' },
    })

  }).then(() => {

    return db.createTable('reading', {
      id: { type: 'int', notNull: true, primaryKey: true, autoIncrement: true },
      mid: {type: 'int', notNull: true,
        foreignKey: {
          name: 'reading_module_fk',
          table: 'module',
          rules: { onDelete: 'CASCADE', onUpdate: 'RESTRICT'},
          mapping: 'id',
        }
      },
      timestamp: { type: 'timestamp', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') },
      temperature: { type: 'real'},
      ph: { type: 'real' },
      ec: { type: 'real' },
    })

  }).then(() => {

    return db.createTable('picture', {
      id: { type: 'int', notNull: true, primaryKey: true, autoIncrement: true },
      mid: { type: 'int', notNull: true,
        foreignKey: {
          name: 'picture_module_fk',
          table: 'module',
          rules: { onDelete: 'CASCADE', onUpdate: 'RESTRICT'},
          mapping: 'id',
        } 
      },
      data: { type: 'bytea', notNull: true },
      timestamp: { type:'timestamp', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') }
    })

  }).then(() => {

    Promise.all([

      db.createTable('private_config_profile', {
        id: { type: 'int', notNull: true, primaryKey: true, autoIncrement: true },
        cid: { type: 'int', 
          foreignKey: {
            name: 'profile_client_fk',
            table: 'client',
            rules: { onDelete: 'SET NULL', onUpdate: 'RESTRICT'},
            mapping: 'id',
          }
        },
        mid: { type: 'int', notNull: true,
          foreignKey: {
            name: 'profile_module_fk',
            table: 'module',
            rules: { onDelete: 'SET NULL', onUpdate: 'RESTRICT'},
            mapping: 'id',
          } 
        },
        name: { type: 'string' },
        is_dirty: { type: 'boolean', defaultValue: true },
        temperature_min: { type: 'real' },
        temperature_max: { type: 'real' },
        ph_min: { type: 'real' },
        ph_max: { type: 'real' },
        ec: { type: 'real' },
        light_on: { type: 'time' },
        light_off: { type: 'time' },
        picture_interval: { type: 'interval' },
      }),

      db.createTable('public_config_profile', {
        id: { type: 'int', notNull: true, primaryKey: true, autoIncrement: true },
        name: { type: 'string' },
        import_count: { type: 'int' },
        temperature_min: { type: 'real' },
        temperature_max: { type: 'real' },
        ph_min: { type: 'real' },
        ph_max: { type: 'real' },
        ec: { type: 'real' },
        light_on: { type: 'time' },
        light_off: { type: 'time' },
        picture_interval: { type: 'interval' },
      })
    ])

  })
};

exports.down = function(db) {
  return Promise.all([
    db.dropTable('public_config_profile'),
    db.dropTable('private_config_profile'),
    db.dropTable('picture'),
    db.dropTable('reading'),
  ]).then(() => {
    return db.dropTable('module')
  }).then(() => {
    return db.dropTable('client')
  })
};

exports._meta = {
  "version": 1
};
