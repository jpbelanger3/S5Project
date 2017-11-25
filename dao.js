

var dao = {
    getPassword: function(client, username) {
        var sql = `SELECT id, password, username FROM client WHERE username = $1`

        return client.query(sql, [username])
    },

    getModuleListing: function(client, cid) {
        var sql = `SELECT id, name, is_last_selected, last_reading_id
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
        var sql = ` SELECT pcp.id, pcp.temperature_min, pcp.temperature_max, pcp.ph_min, pcp.ph_max, pcp.ec, pcp.light_on, pcp.light_off, pcp.picture_interval
                    FROM module 
                    LEFT JOIN private_config_profile pcp ON module.config_id = pcp.id
                    WHERE module.id = $1`
        
        return client.query(sql, [mid])
    }, 

    isConfigDirty: function(client, mid) {
        var sql = ` SELECT pcp.is_dirty
                    FROM module 
                    LEFT JOIN private_config_profile pcp ON module.config_id = pcp.id
                    WHERE module.id = $1`

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
    },

    setConfigDirty: function(client, id) {
        var sql = ` UPDATE private_config_profile SET is_dirty = true
                    WHERE id = $1`

        return client.query(sql, [id])
    },

    getModuleId: function(client, MAC) {
        var sql = ` SELECT id
                    FROM module
                    WHERE mac = $1`

        return client.query(sql, [MAC])
    },

    createNewModule: function(client, cid, MAC) {
        var sql = ` INSERT INTO module (cid, mac, name)
                    VALUES ($1, $2, '***NEW***')
                    RETURNING id`

        return client.query(sql, [cid, MAC])
    },

    createConfig: function(client, cid) {
        var sql = ` INSERT INTO private_config_profile (cid, name, temperature_min, temperature_max, ph_min, ph_max, ec, light_on, light_off, picture_interval)
                    VALUES ($1, '***NEW***', 20, 25, 6, 6.5, 2, '08:00:00', '22:00:00', '04:00:00')
                    RETURNING id`
            
        return client.query(sql, [cid])
    },

    assignConfigToModule: function(client, mid, configId) {
        var sql = ` UPDATE module SET config_id = $2
                    WHERE id = $1`
        
        return client.query(sql, [mid, configId])
    },

    getReading: function(client, readingId) {
        var sql = ` SELECT temperature, ph, ec 
                    FROM reading
                    WHERE id = $1`

        return client.query(sql, [readingId])
    },

    getConfigListing: function(client, cid) {
        var sql = ` SELECT id, name
                    FROM private_config_profile
                    WHERE cid = $1`
        
        return client.query(sql, [cid])
    },

    updateProfileField: function(client, profileId, field, value) {
        var sql = ` UPDATE private_config_profile
                    SET ${field} = $2, is_dirty = true
                    WHERE id = $1`
                
        return client.query(sql, [profileId, value])
    },

    getTemperature: function(client, cid, moduleId) {
        var sql = ` SELECT temperature, timestamp
                    FROM reading
                    WHERE mid = $1
                    ORDER BY timestamp ASC`

        return client.query(sql,[moduleId])
    },

    getPh: function(client, cid, moduleId) {
        var sql = ` SELECT ph, timestamp
                    FROM reading
                    WHERE mid = $1
                    ORDER BY timestamp ASC`

        return client.query(sql,[moduleId])
    },
}

module.exports = dao