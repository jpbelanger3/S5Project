

var dao = {
    getPassword: function(client, username) {
        var sql = `SELECT id, password, username FROM client WHERE username = $1`

        return client.query(sql, [username])
    }
}

module.exports = dao