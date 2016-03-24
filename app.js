var express = require('express');
var JobRunner = require('./job_runner');
var Job = require('./job'); 
var sqlite3 = require('sqlite3').verbose();
var bodyParser = require('body-parser');
var multer = require('multer'); 
var pry = require('pryjs')

var app = express();
app.db = new sqlite3.Database('db.db');

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));



jobRunner = new JobRunner(app.db);

jobRunner.startJobs();

app.get('/', function (req, res) {
  res.send('Job Queue');
});

app.get('/:jobId', function (req, res) {
  var jobId = req.params.jobId;
  var job = new Job({id: jobId}, app.db);
  job.fetch(jobId).then(function(job){
    if(job){
      res.json(job.asJson());
    }else{
      res.status(404).send('Not found');
    }
  }, function(error){
    res.json({error: error});
  })
});

app.post('/', function (req, res) {
  var url = req.body.url;
  var job = new Job({url: url}, app.db);
  job.create().then(function(job){
    res.json(job.asJson());
  }, function(error){
    res.status(422).json({error: error});
  })
});

app.listen(3000, function () {
  console.log('App listening on port 3000');
});

module.exports = app;