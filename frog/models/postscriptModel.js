// postscriptModel
var db = require('../models/db');
var mongoose = require('mongoose'),
Schema = mongoose.Schema,
autoIncrement = require('mongoose-auto-increment');

var connection = mongoose.createConnection("mongodb://localhost/testFrog");
autoIncrement.initialize(connection);

var date = new Date;
var tmpDate = date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate();

var PostscriptSchema = new mongoose.Schema({
	seq : Number,
	writer : {type:Number, default:0},
	rate: {type:Number, default:0},
	term: {type:String, default:"2016-상반기"},
	origin_writeDate: { type:Date, default:Date.now },
	writeDate : { type:String, default:tmpDate },
	comment : { type:String, default:"한줄평"},
	commentGood : {type:String, default:"도움된 점"},
	commentBad : {type:String, default:"아쉬운 점"},
	companyName : {type:String, default:"회사이름"},
	companyLogo : {type:String, default:"/image/logo"},
	activityName : {type:String, default:"대외활동 명"},
	actClass : {type:String, default:"활동분야"},
	activitySeq: {type:Number, default:0 },
	goodCount: {type:Number, default:0 }
});

PostscriptSchema.plugin(autoIncrement.plugin, {model:'PostScript', field:'seq'});
mongoose.model('PostScript', PostscriptSchema);

var PostscriptModel = db.model('PostScript');

require('../models/activityModel');
var ActivityModel = db.model('Activity');

require('../models/memberModel');
var MemberModel = db.model('Member');

exports.detailPostscript = function(postscriptSeq, callback){
	console.log('detailPostscript postscriptSeq = ', postscriptSeq);

	PostscriptModel.findOne( {'seq': postscriptSeq}, function(err, postscript){
		if(err) callback( {error: 'database fail detailPostscript activity page' });
		if(!postscript) console.log('err', err);
		// if(!postscript) callback( {error: 'not found postscript activity page' });
		else{
			var obj = { 
				"title": "활동후기 상세페이지",
				"postscript": postscript
			}
			callback(obj);
		}
	});	// postscriptModel
}	// detailPostscript



exports.writePostscript = function(req, callback){
	console.log('in postscript=', req.body);

	var loginEmail = req.session.loginEmail;
	var point;
	var addPoint = 10;

 	var activitySeq = req.body.activitySeq;
	var rate = (req.body.rate * 1).toExponential(1);
	var term = req.body.term;
	var comment = req.body.comment;
	var commentGood = req.body.commentGood;
	var commentBad = req.body.commentBad;

	var date = new Date;
	var writeDateStr = date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate();

	MemberModel.findOne({'loginEmail': loginEmail}, function(err, member){
		if(err) console.log('postscript-writePostscript MemberModel err', err);
		if(!member) console.log('postscript-writePostscript not found member');

		// 대외활동 명, 로고, 회사명 등을 가져오기 위함.
		ActivityModel.findOne( {'seq': activitySeq}, function(err, activity){
			if(err) console.log('postscript-writePostscript ActivityModel err', err);
			if(!activity) console.log('postscript-writePostscript not found activity');
			else{
				var postscript = new PostscriptModel({
					'writer' : member.seq,
					'rate': rate,
					'term': term,
					'writeDate': writeDateStr,
					'comment' : comment,
					'commentGood' : commentGood,
					'commentBad' : commentBad,
					'companyName' : activity.companyName,
					'companyLogo' : activity.companyLogo,
					'activityName' : activity.name,
					'actClass' : activity.actClass,
					'activitySeq': activitySeq
				}); // new PostScriptModel

				postscript.save(function(err, doc){
					if(err) console.log('postscript-writePostscript postscript.save err', err);			
					
					point = member.point+addPoint;
					member.update({$set:{'point':point}}, function(err){
						if(err) console.log('postscript-writePostscript member.update err ', err);
					});	// member.update

					// activity 정보 수정
					var score = 0;
					console.log('score = ', score);
					score = score + activity.totalPostCountStar[0] * 1;
					score = score + activity.totalPostCountStar[1] * 2;
					score = score + activity.totalPostCountStar[2] * 3;
					score = score + activity.totalPostCountStar[3] * 4;
					score = score + activity.totalPostCountStar[4] * 5;

					console.log('score = ', score);
					activity.averageRate = (( score + rate ) / ++activity.totalPostCount);  // averageRate
					if( activity.averageRate < 0.7 ) activity.averageRate = 0.5;
					else if( activity.averageRate < 1.2 ) activity.averageRate = 1.0;
					else if( activity.averageRate < 1.7 ) activity.averageRate = 1.5;
					else if( activity.averageRate < 2.2 ) activity.averageRate = 2.0;
					else if( activity.averageRate < 2.7 ) activity.averageRate = 2.5;
					else if( activity.averageRate < 3.2 ) activity.averageRate = 3.0;
					else if( activity.averageRate < 3.7 ) activity.averageRate = 3.5;
					else if( activity.averageRate < 4.2 ) activity.averageRate = 4.0;
					else if( activity.averageRate < 4.7 ) activity.averageRate = 4.5;
					else activity.averageRate = 5.0;


					activity.totalPostCountStar[rate-1]++;

					// updateArray
					activity.save(function(err){
						if(err) console.log('postscript-writePostscript activity.save err', err);
						activity.update({$set:{'totalPostCountStar':activity.totalPostCountStar}}, function(err){
							if(err) console.log('postscript-writePostscript activity.update err', err);
							var obj = { "status": "OK" }
							callback(obj);
						}); //activity.update
					}); // activity.save       
				}); // postscript.save
			}
		});	// ActivityModel
	});	// MemberModel
}



exports.createPostscript = function(callback){  

	var activitySeq = 2;
	ActivityModel.findOne( {'seq': activitySeq}, function(err, activity){
		if(err) return res.status(500).json( {error: 'database error createInterview' });
		var tmpCompanyLogo = activity.companyLogo;
		var tmpCompanyName = activity.companyName;
		var tmpActivityName = activity.activityName;

		var postscript = new PostscriptModel({
			writer : 12,
			comment : "한줄평한줄평한줄평한줄평한줄평한줄평한줄평한줄평한줄평한줄평한줄평한줄평한줄평한줄평한줄평한줄평한줄평한줄평한줄평한줄평한줄평한줄평한줄평한줄평",
			commentGood : "도움된 점도움된 점도움된 점도움된 점도움된 점도움된 점도움된 점도움된 점도움된 점도움된 점도움된 점도움된 점도움된 점도움된 점도움된 점도움된 점도움된 점",
			commentBad : "아쉬운 점아쉬운 점아쉬운 점아쉬운 점아쉬운 점아쉬운 점아쉬운 점아쉬운 점아쉬운 점아쉬운 점아쉬운 점아쉬운 점아쉬운 점아쉬운 점아쉬운 점아쉬운 점아쉬운 점",
			companyLogo: tmpCompanyLogo,
			companyName: tmpCompanyName,
			activityName: tmpActivityName,
			activitySeq: activitySeq
		});
		postscript.save( function(err, doc){
			if(err) return console.error(err);
			console.log(doc);
			callback(doc);
		}); // interview.save
	}); // ActivityModel
}


//  ******************* End Project ******************* //
//  *******************             ******************* //
//  *******************             ******************* //
//  *******************             ******************* //
//  *******************             ******************* //
//  *******************             ******************* //
//  *******************             ******************* //
//  *******************             ******************* //
//  *******************             ******************* //
//  *******************             ******************* //
//  *******************             ******************* //
//  *******************             ******************* //
//  *******************             ******************* //
//  ******************* End Project ******************* //

exports.insertPostscript = function(req, callback){

	var date = new Date;
	var tmpDate = date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate();

	var loginEmail = req.session.loginEmail;
	var activitySeq = req.body.activitySeq;

	var point;
	var addPoint = 10;

		
	loginEmail = 'admin';
	MemberModel.findOne({'loginEmail': loginEmail}, function(err, member){
		if(err) callback({error:'database writePostscript error'});

		// 대외활동 명, 로고, 회사명 등을 가져오기 위함.
		ActivityModel.findOne( {'seq': activitySeq}, function(err, activity){
			if(err) callback( {error: 'database write postscript actvitiy' });

			var postscript = new PostscriptModel({
				'writer' : member.seq,
				'rate': req.body.rate,
				'term': req.body.term,
				'writeDate': tmpDate,
				'comment' : req.body.comment,
				'commentGood' : req.body.commentGood,
				'commentBad' : req.body.commentBad,
				'companyName' : activity.companyName,
				'companyLogo' : activity.companyLogo,
				'activityName' : activity.name,
				'actClass' : activity.actClass,
				'activitySeq': activitySeq
			}); // new PostScriptModel

			postscript.save(function(err, doc){
				if(err) console.log('err', err);			
				
				point = member.point+addPoint;
				member.update({$set:{'point':point}}, function(err){
					if(err) callback( {error: 'database fail member point '});          
				});	// member.update

				console.log('1--------------------------------------------------------------------------1 web insert rate ', req.body.rate);
				console.log('1--------------------------------------------------------------------------1 activity.averageRate ', activity.averageRate);
				console.log('1--------------------------------------------------------------------------1 activity.totalPostCount ', activity.totalPostCount);

				// activity 정보 수정
				var tmpAverage = activity.averageRate * activity.totalPostCount;				
				activity.totalPostCount++;
				activity.averageRate = Math.round( (parseInt(tmpAverage)+parseInt(req.body.rate)) / activity.totalPostCount);  // averageRate
							
				
				console.log('1--------------------------------------------------------------------------1 web insert tmpAverage / rate ', tmpAverage, req.body.rate);
				console.log('2--------------------------------------------------------------------------2 activity.averageRate ', activity.averageRate);
				console.log('2--------------------------------------------------------------------------2 activity.totalPostCount ', activity.totalPostCount);


				activity.totalPostCountStar[req.body.rate-1]++;

				// updateArray
				activity.save(function(err){
					if(err) callback( {error: 'database fail write post update activity' });
					activity.update({$set:{'totalPostCountStar':activity.totalPostCountStar}}, function(err){
						if(err) callback	( {error:'database array'});
						var obj = { "status": "OK" }
						callback(activitySeq);
					}); //activity.update
				}); // activity.save       
			}); // postscript.save
		});	// ActivityModel
	});	// MemberModel
}

exports.webDetailPostscript = function(seq, activitySeq, callback){
	
	
	ActivityModel.findOne({'seq':activitySeq}, function(err, activity){
		if(err) console.log('error',err);
		console.log('detailActivity', activity);

		PostscriptModel.findOne({'seq':seq}, function(err, postscript){
			if(err) console.log('error', err);

			var obj = {
				"activity": activity,
				"postscript": postscript
			}

			console.log(obj);
			callback(obj);
		});	// Postscript
	});	// ActivityModel
}

exports.updatePostscript = function(req, callback){

	var term = req.body.term;
	var rate = req.body.rate;
	var comment = req.body.comment;
	var commentGood = req.body.commentGood;
	var commentBad = req.body.commentBad;

	var seq = req.body.seq;
	PostscriptModel.findOne({'seq':seq}, function(err, postscript){
		if(err) callback({error:'db error updatePostscript'});
		
		postscript.rate = rate;
		postscript.term = term;
		postscript.comment = comment;
		postscript.commentGood = commentGood;
		postscript.commentBad = commentBad;

		postscript.save(function(err, dox){
			if(err) console.log('err', err);
			callback(req.body.activitySeq);
		});
	});
}	// updatePostscript

exports.webDeletePost = function(req, callback){

	PostscriptModel.remove({'seq':req}, function(err){
		if(err) console.log('err', err);
		var obj = {
			"status": "OK"
		}
		callback(obj);
	});
}