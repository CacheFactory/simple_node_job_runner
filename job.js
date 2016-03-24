var sqlite3 = require('sqlite3').verbose();
var pry = require('pryjs');
var request = require('request');

var Job = function(ops, db){
  this.db = db;
  this.id = ops.id;
  this.url = ops.url;
  this.state = ops.state;
  this.response = ops.response;
}

Job.prototype.asJson = function(){
  return {
    id: this.id,
    url: this.url,
    state: this.state,
    response: this.response
  };
}

Job.prototype.isValid = function(){
  //took from http://stackoverflow.com/questions/1303872/trying-to-validate-url-using-javascript
  return /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(this.url);
}

Job.prototype.save = function(){
  var self = this;
  return new Promise(function (fulfill, reject){
    self.db.all("UPDATE jobs SET url=?, state=?, response=? WHERE id=?", self.url, self.state, self.response, self.id, function(err, rows) {
      if(err){
        reject(self);
      }
      fulfill(self);
    });  
  });
}

Job.prototype.fetch = function(){
  var self = this;

  return new Promise(function (fulfill, reject){
    self.db.all("select * from jobs where id = ?", self.id, function(err, rows) {
      if(err){
        reject(err);
      }
      var row = rows[0];
      if(row){
        self.url = row.url;
        self.state = row.state;
        self.response = row.response;

        fulfill(self);
      }else{
        fulfill(false);
      }
      
    })
  });
}

Job.prototype.runJob = function(){
  var self = this
  return new Promise(function (fulfill, reject){
    request(self.url, function (error, response, body) {  
      if (!error && response.statusCode == 200) {
        self.state = "SUCCESS";
        self.response = body;
        self.save();
      }else{
        self.state = "ERROR";
        self.save();
      }
      fulfill(self)
    });
  });
}

Job.prototype.create = function(){
  var self = this;

  return new Promise(function (fulfill, reject){
    if(!self.isValid()){
      reject("Invalid URL");
    }

    self.state = "new";

    self.db.run("INSERT INTO 'jobs' (url, state, created_at) VALUES(?, ?, ?);", self.url, self.state, Date.now(),function(err, row){
      if(err){
        reject(err);
      }

      self.id = this.lastID;
      fulfill(self);
    });
  });
}

module.exports = Job;