// models/db.js
var mongoose = require('mongoose');
var uri = 'mongodb://localhost/frog';
// var uri = 'mongodb://localhost/testFrog';
var options = {
	server: { poolSize : 100 }
}
var db = mongoose.createConnection(uri, options);

// on : 이벤트가 발생했을때
db.on('error', function(err){
	if(err) console.error('db error', err);
});

// 딱 한번만 실행된다.
db.once('open', function callback(){
	console.info('Mongo db connected successfully');
});

module.exports = db;