

var dao = {
    getPassword: function(client, username) {
        var sql = `SELECT id, password FROM client WHERE username = $1`

        return client.query(sql, [username])
    }
}

module.exports = dao