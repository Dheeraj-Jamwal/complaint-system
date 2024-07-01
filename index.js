const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const saltRounds = 10;

// Connection URL
const url = 'mongodb://127.0.0.1:27017/';
const client = new MongoClient(url);
// Database Name
const dbName = 'mriirs';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function (req, file, cb) {
    const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniquePrefix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

console.log("hello");

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use(cookieParser());

// Secret key for JWT
const secretKey = 'your_secret_key';

// Authentication middleware
const authenticateJWT = (req, res, next) => {
  const token = req.cookies.token;

  if (token) {
    jwt.verify(token, secretKey, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/sign.html');
});

app.post('/sign', async function (req, res) {
  let p = req.body['user'];
  let q = req.body['Password'];

  try {
    await client.connect();
    console.log('Connected successfully to server');
    const db = client.db(dbName);
    const collection = db.collection('users');

    const hashedPassword = await bcrypt.hash(q, saltRounds);
    await collection.insertOne({ username: p, password: hashedPassword });

    console.log('User inserted');
    res.sendFile(__dirname + '/login.html'); // Send home.html directly after signup
  } catch (e) {
    console.error(e);
    res.status(500).send('Error while signing up');
  } finally {
    await client.close();
  }
});

app.post('/login', async function (req, res) {
  const { user, password } = req.body;

  try {
    await client.connect();
    console.log('Connected successfully to server');
    const db = client.db(dbName);
    const collection = db.collection('users');

    const userRecord = await collection.findOne({ username: user });
    if (!userRecord) {
      return res.status(401).send('Invalid username or password');
    }

    const match = await bcrypt.compare(password, userRecord.password);
    if (!match) {
      return res.status(401).send('Invalid username or password');
    }

    const token = jwt.sign({ username: user }, secretKey, { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true });
    res.sendFile(__dirname + '/home.html');
  } catch (e) {
    console.error(e);
    res.status(500).send('Error while logging in');
  } finally {
    await client.close();
  }
});

app.post('/logout', function (req, res) {
  res.clearCookie('token');
  res.send('Logged out successfully');
});

app.post('/home', authenticateJWT, upload.single('uploaded_file'), async function (req, res) {
  let a = req.body['user_email'];
  let b = req.body['user_name'];
  let c = req.body['user_location'];
  let d = req.body['user_message'];
  let e = req.file.path;
  console.log(a, b, c, d);

  try {
    await client.connect();
    console.log('Connected successfully to server');
    const db = client.db(dbName);
    const collection = db.collection('complaint');
    await collection.insertOne({ email: a, name: b, location: c, message: d, img_path: e });
    console.log('Complaint inserted');
    res.sendFile(__dirname + '/home.html'); // Send home.html directly after complaint submission
  } catch (e) {
    console.error(e);
    res.status(500).send('Error while submitting complaint');
  } finally {
    await client.close();
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
