var request = require('supertest');
var mocha = require('mocha');
var app = require('../app.js');
var Job = require('../job.js');

describe('GET /', function(){
  it('respond with 200', function(done){
    request(app)
      .get('/')
      .expect(200, done);
  })
})

describe('GET /:id', function(){
  it('respond with 200', function(done){
    var job = new Job({url: 'http://www.google.com'}, app.db)
    job.create().then(function(){
      request(app)
        .get('/'+job.id)
        .expect(200, done)
        .expect(function(res) {
          res.body.id = job.id;
          res.body.url = job.url;
        })
    })
  })
})

describe('POST /', function(){
  it('respond with 200', function(done){
    request(app)
      .post('/')
      .send({url: 'https://www.google.com'})
      .expect(200, done)
      .expect(function(res) {
        res.body.url = 'https://www.google.com';
      })
  })

  it('respond with 422 with bad data', function(done){
    request(app)
      .post('/')
      .send({url: 'htt'})
      .expect(422, done);
  })
})