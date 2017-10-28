

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
    }

}

module.exports = dao