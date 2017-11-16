// Server Initialisation
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
  cookie: { maxAge: 999999999999999 }
}))

app.use(express.static(__dirname + '/public'))

const secret = 'admin1'
const hash = crypto.createHmac('sha256', secret).update('s5-project').digest('hex')
console.log('password: '+ secret + '| hash: '+ hash)


app.set('views', __dirname + '/views')
app.set('view engine', 'ejs')


// Function to render main page
app.get('/', async function(request, response) {
  if (request.session && request.session.user) {
    var cid = request.session.user.id
    var results = {}
    var lastSelectedModule = {}

    var client = await pool.connect()
    var modules = await dao.getModuleListing(client, cid)
    if (modules.rows.length > 0) {
      lastSelectedModule = modules.rows.filter((mod) => { return mod.is_last_selected })[0] || modules.rows[0]
    } else {
      lastSelectedModule.id = 0
    }
    
    client.release()
    results.modules = modules.rows
    results.selectedModuleId = lastSelectedModule.id || null
    response.render('pages/accueil_projet', results )
    
  } else {
    response.redirect('/login')
  }
})

// Get login page
app.get('/login', function(request, response) {
    response.render('pages/login')
})

// User login
app.post('/login', async function (request, response) {
  var username = request.body.username
  var password = request.body.password.toString()
  var hash = crypto.createHmac('sha256', password).update('s5-project').digest('hex')

  var client = await pool.connect()
  var result = await dao.getPassword(client, username)
  client.release()

  if (result.rows.length > 0 && result.rows[0].password === hash) {
    request.session.user = result.rows[0]
    response.send(true)
  } else {
    response.send(false)
  }
})

// User logout
app.post('/logout', function(request,response) {
  if (request.session && request.session.user) {
    request.session.user = undefined
    response.send(true)
  }
})

// Switch module
app.put('/module/switch/:id', async function(request, response) {
  var cid = request.session.user.id
  var moduleId = request.params.id

  var client = await pool.connect()
  await dao.resetSelectedModule(client, cid)
  await dao.selectModule(client, cid, moduleId)
  client.release()

  response.send(true)
})

// Test
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


/**********************/
/******** Mbed ********/
/**********************/

app.get('/module/:MAC/config', async function(request, response) {
  var moduleMac = request.params.MAC
  var cid = request.query.cid || null
  var mid

  var client = await pool.connect()
  var midRes = await dao.getModuleId(client, moduleMac)
  if (midRes.rows.length === 0) {
    midRes = await dao.createNewModule(client, cid, moduleMac)
    mid = midRes.rows[0].id
    await dao.createConfig(client, cid, mid)
  } else {
    mid = midRes.rows[0].id
  }
  var result = await dao.getModuleConfig(client, mid)
  var config = result.rows[0]
  await dao.cleanConfig(client, config.id)
  client.release()

  response.send(config)
})

app.post('/module/:MAC/reading', async function(request, response) {
  var moduleMac = request.params.MAC
  var timestamp = request.body.timestamp ? new Date(request.body.timestamp * 1000) : new Date()
  var temperature = parseFloat(request.body.temperature) || null 
  var ph = parseFloat(request.body.ph) || null
  var ec = parseFloat(request.body.ec) || null

  var client = await pool.connect()
  var midRes = await dao.getModuleId(client, moduleMac)
  var mid = midRes.rows[0].id
  var readingResult = await dao.insertReading(client, mid, timestamp, temperature, ph, ec)
  await dao.updateLastReadingId(client, mid, readingResult.rows[0].id)
  var result = await dao.isConfigDirty(client, mid)
  client.release()

  var needConfigUpdate = result.rows[0].is_dirty
  response.send(needConfigUpdate)
})

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
})