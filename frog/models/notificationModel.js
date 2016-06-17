// interviewModel
var db = require('../models/db');
var async = require('async');
var mongoose = require('mongoose'),
Schema = mongoose.Schema,
autoIncrement = require('mongoose-auto-increment');

var connection = mongoose.createConnection("mongodb://localhost/testFrog");
autoIncrement.initialize(connection);

var date = new Date;
var tmpDate = date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate();

var NotificationSchema = new mongoose.Schema({
	seq : Number,
	memberSeq: { type:Number, default: 0 },
	loginEmail : { type:String, default: "loginEmail" },
	content: { type:String, default:"content" },
	writeDate: { type:Date, default: Date.now }
});

NotificationSchema.plugin(autoIncrement.plugin, {model:'Notification', field:'seq'});
mongoose.model('Notification', NotificationSchema);

var NotificationModel = db.model('Notification');

exports.pushList = function(req, result_callback) {
	
	var loginEmail = req.session.loginEmail;
	var notiArr = [];
	
	async.waterfall([
		function(callback){
			NotificationModel.find({'loginEmail': loginEmail}, function(err, notification){
				if(err) console.log('noti-pushList NotificationModel err', err);
				if(!notification) console.log('noti-pushList not found notification');
				callback(null, notification);
			}).sort( {writeDate:-1} );
		},
		function(notis, callback){
			async.eachSeries(notis, function(item, cb){
				notiArr.push(item.content);
				cb();								
			}, function(err){
				if(err) console.log('noti-pushList before result err', err);
				var obj = { "contents": notiArr }
				callback(null, obj);
			}); // async.each
		} 
	],	// waterfall
	function(err, result){
		if(err) console.log('noti-pushList result err', err);
		result_callback(result);            
	}); //async
}	// pushList

