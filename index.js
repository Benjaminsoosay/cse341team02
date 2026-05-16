const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const mongodb = require('./db/connect');

const app = express();
const port = process.env.PORT || 8080;

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('./public'));

app.use(
  session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true
  })
);

// Home Route
app.get('/', (req, res) => {
  res.send('Welcome to Contacts API');
});

// Login Route (only works if you use a view engine)
app.get('/login', (req, res) => {
  res.send('Login page'); // safer than res.render unless you set a view engine
});

// Routes
app.use('/contacts', require('./routes/contacts'));

// Uncaught Exception Handler
process.on('uncaughtException', (err) => {
  console.error('There was an uncaught error:', err);
});

// MongoDB Connection
mongodb.initDb((err) => {
  if (err) {
    console.log('Database connection failed:', err);
  } else {
    app.listen(port, () => {
      console.log(`Connected to DB and listening on port ${port}`);
    });
  }
});