var express = require('express')
var crypto = require('crypto')
var bodyParser = require('body-parser')
var app = express()
var ConnectionStringParser = require('pg-connection-string').parse
var pg = require('pg')
var devDATABASE_URL = "postgres://postgres:O8bSkVesnUfi@localhost:5432/s5-project"
var connectionObject = ConnectionStringParser((process.env.DATABASE_URL || devDATABASE_URL))
var pool = new pg.Pool(connectionObject)
var session = require('express-session');
var dao = require('./dao')

app.use( bodyParser.json() )
app.use(bodyParser.urlencoded({ extended: true }));
app.set('port', (process.env.PORT || 8081))
app.use(session({
  secret: 'Shhh!',
  resave: true,
  saveUninitialized: true,
}))

app.use(express.static(__dirname + '/public'))

const secret = 'admin1'
const hash = crypto.createHmac('sha256', secret).update('s5-project').digest('hex')
console.log('password: '+ secret + '| hash: '+ hash)

// views is directory for all template files
app.set('views', __dirname + '/views')
app.set('view engine', 'ejs')

app.post('/login', function (request, response) {
  var username = request.body.username
  var password = request.body.password.toString()
  var hash = crypto.createHmac('sha256', password).update('s5-project').digest('hex')

  pool.connect(function(err, client, done) {
    dao.getPassword(client, username)
    .then((result) => {
      done()
      if (result.rows.length > 0 && result.rows[0].password === hash) {
        request.session.user = result.rows[0]
        response.send(true)
      } else {
        response.send(false)
      }
    })
  })
})

app.get('/', function(request, response) {
  if (request.session && request.session.user) {
    response.render('pages/accueil_projet')
  } else {
    response.redirect('/login')
  }
})

app.get('/login', function(request, response) {
    response.render('pages/login')
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
        response.send(result.rows)
      }
      })
   })
})

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
})