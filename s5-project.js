var express = require('express')
var app = express()

var ConnectionStringParser = require('pg-connection-string').parse
var pg = require('pg')
var devDATABASE_URL = "postgres://postgres:O8bSkVesnUfi@localhost:5432/s5-project"
var connectionObject = ConnectionStringParser((process.env.DATABASE_URL || devDATABASE_URL))
var pool = new pg.Pool(connectionObject)


app.set('port', (process.env.PORT || 8081))

app.use(express.static(__dirname + '/public'))

// views is directory for all template files
app.set('views', __dirname + '/views')
app.set('view engine', 'ejs')

app.get('/', function(request, response) {
  response.render('pages/accueil_projet');
})

app.post('/db/:id', function (request, response) {
  var id = request.params.id
  var sql = ` SELECT id, test_text
              FROM test
              WHERE id = $1`

  pool.connect(function(err, client, done) {
    client.query(sql, [id], function(err, result) {
      done()
      if (err) { console.error(err)
        response.send("Error " + err)
      } else { 
        response.render('pages/db', {results: result.rows} )
      }
      })
   })
})

app.post('/db', function (request, response) {
  var id = request.params.id
  var sql = ` SELECT id, test_text
              FROM test`

  pool.connect(function(err, client, done) {
    client.query(sql, [id], function(err, result) {
      done()
      if (err) { console.error(err)
        response.send("Error " + err)
      } else { 
        response.send(result)
      }
      })
   })
})

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
})