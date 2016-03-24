var sqlite3 = require('sqlite3').verbose();
var Job = require('./job');

var pry = require('pryjs')

var JobRunner = function(db){
  this.db = db;
  this.runningJobs = 0;
  this.intervalTimeMs = 1000;
}

JobRunner.MAX_JOBS = 10;


JobRunner.prototype.startJobs = function(){
  var self = this;
  setInterval(function(){
    self.runJobs();
  }, self.intervalTimeMs);
}


JobRunner.prototype.runJobs = function(){
  var self = this;
  var numJobsToRun = JobRunner.MAX_JOBS - this.runningJobs;
  return new Promise(function (fulfill, reject){
    self.db.all("select * from jobs where state = 'new' order by created_at ASC LIMIT ?", numJobsToRun, function(err, rows) {
      for(var i in rows ){
        var job = new Job(rows[i], self.db);
        self.runningJobs++;

        job.runJob().then(function(){
          self.runningJobs--;
        },
        function(){
          self.runningJobs--;
        })
        
      }
    }); 
    fulfill();
  });
}

module.exports = JobRunner;
