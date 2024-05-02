const express = require('express')
const app = express();
const port = 3001;
const db_wrapper = require('./db_wrapper')

app.use(express.json())
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Access-Control-Allow-Headers');
  next();
});

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  db_wrapper.getExample().then(response => {
    res.status(200).send(response);
  }).catch(error => {
    res.status(500).send(error);
  });
  
});

app.listen(port, () => {
  console.log(`App running on port ${port}.`)
});