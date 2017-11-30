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
var api = require('./api')

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

app.set('views', __dirname + '/views')
app.set('view engine', 'ejs')

/*********************/
/***** Socket.io *****/
/*********************/
var server = require('http').createServer(app)
var io = require('socket.io')(server)

io.on('connection', (socket) => {
  var clientIp = socket.request.connection.remoteAddress
  console.log('New Socket connection: ' + clientIp)

  socket.on('disconnect', function() {
    console.log('Socket.IO --- disconnected ' + clientIp)
  })
})

/*********************/
/****** Website ******/
/*********************/
// Function to render main page
app.get('/', async function(request, response, next) {
  if (request.session && request.session.user) {
    var cid = request.session.user.id

    var client = await pool.connect()
    api.getWebSiteData(client, cid)
      .then((data) => {
        client.release()
        console.log('*****Website Data******   :')
        console.log(data)
        response.render('pages/accueil_projet', data)
      })
      .catch((err) => { next(err) })

  } else {
    response.redirect('/login')
  }
})

// Get login page
app.get('/login', function(request, response, next) {
    response.render('pages/login')
})

// User login
app.post('/login', async function (request, response, next) {
  var username = request.body.username
  var password = request.body.password.toString()
  var hash = crypto.createHmac('sha256', password).update('s5-project').digest('hex')

  var client = await pool.connect()
  api.login(client, username, hash, request)
  .then((data) => {
    client.release()
    response.send(data)
  })
  .catch((err) => { next(err) })
})

// User logout
app.post('/logout', function(request,response, next) {
  if (request.session && request.session.user) {
    request.session.user = undefined
    response.send(true)
  }
})

// Switch module
app.put('/module/switch/:id', async function(request, response, next) {
  var cid = request.session.user.id
  var moduleId = request.params.id

  var client = await pool.connect()
  api.switchModule(client, cid, moduleId)
  .then((data) => {
    client.release()
    response.send(true)
  })
  .catch((err) => { next(err) })
})

// Switch profile
app.put('/module/:mid/switchprofile/:id', async function(request, response, next) {
  var cid = request.session.user.id
  var mid = request.params.mid
  var profileId = request.params.id

  var client = await pool.connect()
  api.switchProfile(client, cid, mid, profileId)
  .then((data) => {
    client.release()
    response.send(data)
  })
  .catch((err) => { next(err) })
})

app.get('/publicprofiles', async function(request, response, next) {
  var client = await pool.connect()
  api.getPublicProfiles(client)
  .then((data) => {
    client.release()
    response.send(data)
  })
  .catch((err) => { next(err) })
})

// Update profile
app.put('/profile/:id/update', async function(request, response, next) {
  var cid = request.session.user.id || 1
  var profileId = request.params.id
  var field = request.body.field
  var value = request.body.value

  var client = await pool.connect()
  api.updateProfile(client, profileId, field, value)
  .then((data) => {
    client.release()
    response.send(data)
  })
  .catch((err) => { next(err) })
})

//Import profiles
app.post('/profile/import', async function(request, response, next) {
  var cid = request.session.user.id
  var publicProfilesId = request.body.ids

  var client = await pool.connect()
  api.importProfiles(client, cid, publicProfilesId)
  .then((data) => {
    client.release()
    response.send(data)
  })
  .catch((err) => { next(err) })
})

//Create Profile
app.post('/profile/create', async function(request, response, next) {
  var cid = request.session.user.id
  var name = request.body.name
  var temperature_min = request.body.temperature_min
  var temperature_max = request.body.temperature_max
  var ph_min = request.body.ph_min
  var ph_max = request.body.ph_max
  var ec = request.body.ec
  var light_on = request.body.light_on
  var light_off = request.body.light_off
  var picture_interval = request.body.picture_interval

  var client = await pool.connect()
  api.createProfile(client, cid, name, temperature_min, temperature_max, ph_min, ph_max, ec, light_on, light_off, picture_interval)
  .then((data) => {
    client.release()
    response.send(data)
  })
  .catch((err) => { next(err) })
})

// get temperature
app.get('/module/:id/temperature', async function(request, response, next) {
  var cid = request.session.user.id
  var moduleId = request.params.id

  var client = await pool.connect()
  api.getTemperature(client, cid, moduleId)
  .then((data) => {
    client.release()
    response.send(data)
  })
  .catch((err) => { next(err) })
})

// get ph
app.get('/module/:id/ph', async function(request, response, next) {
  var cid = request.session.user.id
  var moduleId = request.params.id

  var client = await pool.connect()
  api.getPh(client, cid, moduleId)
  .then((data) => {
    client.release()
    response.send(data)
  })
  .catch((err) => { next(err) })
})

// get fertilisant
app.get('/module/:id/fertilisant', async function(request, response, next) {
  var cid = request.session.user.id
  var moduleId = request.params.id

  var client = await pool.connect()
  api.getFertilisant(client, cid, moduleId)
  .then((data) => {
    client.release()
    response.send(data)
  })
  .catch((err) => { next(err) })
})

/**********************/
/******** Mbed ********/
/**********************/

app.get('/module/:MAC/config', async function(request, response, next) {
  var moduleMac = request.params.MAC
  var cid = request.query.cid || null

  var client = await pool.connect()
  api.getModuleConfig(client, cid, moduleMac)
  .then((data) => {
    client.release()
    response.send(data)
  })
  .catch((err) => { next(err) })
})

app.post('/module/:MAC/reading', async function(request, response, next) {
  var moduleMac = request.params.MAC
  var timestamp = request.body.timestamp ? new Date(request.body.timestamp * 1000) : new Date()
  var temperature = parseFloat(request.body.temperature) || null 
  var ph = parseFloat(request.body.ph) || null
  var ec = parseFloat(request.body.ec) || null

  var client = await pool.connect()
  api.postModuleReading(client, moduleMac, timestamp, temperature, ph, ec)
  .then((data) => {
    client.release()
    io.of('/' + data.mid).emit('reading', { 
      temperature: temperature,
      ph: ph,
      ec: ec,
    })
    response.send(data.needConfigUpdate)
  })
  .catch((err) => { next(err) })
})

/*********************/
/****** Android ******/
/*********************/

app.get('/data', async function(request, response, next) {
  var cid = 1;

  var client = await pool.connect()
  api.getDataForAndroidApp(client, cid)
  .then((data) => {
    client.release()
    response.send(data)
  })
  .catch((err) => { next(err) })
})

server.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
})