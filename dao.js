

var dao = {
    getPassword: function(client, username) {
        var sql = `SELECT id, password, username FROM client WHERE username = $1`

        return client.query(sql, [username])
    },

    getModuleListing: function(client, cid) {
        var sql = `SELECT id, name, is_last_selected
                    FROM module
                    WHERE cid = $1`

        return client.query(sql, [cid])
    },

    resetSelectedModule: function(client, cid) {
        var sql = `UPDATE module SET is_last_selected = false
                    WHERE cid = $1 AND is_last_selected = true`
        
        return client.query(sql, [cid])
    },

    selectModule: function(client, cid, moduleId) {
        var sql = `UPDATE module SET is_last_selected = true
                    WHERE cid = $1 AND id = $2`

        return client.query(sql, [cid, moduleId])
    }, 

    getModuleConfig: function(client, mid) {
        var sql = ` SELECT id, temperature_min, temperature_max, ph_min, ph_max, ec, light_on, light_off
                    FROM private_config_profile
                    WHERE mid = $1`
        
        return client.query(sql, [mid])
    }, 

    isConfigDirty: function(client, mid) {
        var sql = ` SELECT is_dirty
                    FROM private_config_profile
                    WHERE mid = $1`

        return client.query(sql, [mid])
    },

    insertReading: function(client, mid, timestamp, temperature, ph, ec) {
        var sql = ` INSERT INTO reading (mid, timestamp, temperature, ph, ec)
                    VALUES ($1, $2, $3, $4, $5) 
                    RETURNING id` 
        
        return client.query(sql, [mid, timestamp, temperature, ph, ec])
    },

    updateLastReadingId: function(client, mid, id) {
        var sql = ` UPDATE module SET last_reading_id = $2
                    WHERE id = $1`

        return client.query(sql, [mid, id])
    },

    cleanConfig: function(client, id) {
        var sql = ` UPDATE private_config_profile SET is_dirty = false
                    WHERE id = $1`
        
        return client.query(sql, [id])
    }

}

module.exports = dao