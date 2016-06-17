// interviewModel
var db = require('../models/db');
var mongoose = require('mongoose'),
Schema = mongoose.Schema,
autoIncrement = require('mongoose-auto-increment');

var connection = mongoose.createConnection("mongodb://localhost/testFrog");
autoIncrement.initialize(connection);

var date = new Date;
var tmpDate = date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate();

var InterviewSchema = new mongoose.Schema({
	seq : Number,
	writer : { type:Number, default:0 },
	term : { type:String, default:"2016 상반기" },
	origin_writeDate: { type:Date, default: Date.now },
	writeDate : { type:String, default: tmpDate },
	level : { type:Number, default: 0 },
	result : { type:String, default:1 },
	question : { type:String, default:"질문이 이렇습니까?" },
	answer : { type:String, default:"대답은 이렇습니다."},
	way : { type:String, default:"면접방식"},
	companyLogo : { type:String, default:"/image/logo"},
	companyName : { type:String, default:"회사이름"},
	activityName : { type:String, default:"대외활동 명"},
	actClass : {type:String, default: "활동분야"},
	activitySeq: {type:Number, default: 0},
	goodCount: {type:Number, default:0}
});

InterviewSchema.plugin(autoIncrement.plugin, {model:'Interview', field:'seq'});
mongoose.model('Interview', InterviewSchema);

var InterviewModel = db.model('Interview');

require('../models/activityModel');
var ActivityModel = db.model('Activity');

require('../models/memberModel');
var MemberModel = db.model('Member');



exports.detailInterview = function(interviewSeq, callback){

	InterviewModel.findOne( {'seq': interviewSeq}, function(err, interview){
		if(err) console.log('detailInterview err', err);
		if(!interview) console.log('detailInterview not found interview');
		else{
			var obj = { 
				"title": "면접후기 상세페이지",
				"interview": interview 
			}    
			callback(obj);
		}
	}); // InterviewModel
}	// detailInterview


exports.writeInterview = function(req, callback){

	var point;
	var addPoint = 10;

	var loginEmail = req.session.loginEmail;
	var term = req.body.term;
	var level = (req.body.level*1);
	var result = req.body.result;
	var question = req.body.question;
	var answer = req.body.answer;
	var way = req.body.way;
	var activitySeq = req.body.activitySeq;

	var date = new Date;
	var writeDateStr = date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate();

	MemberModel.findOne({'loginEmail': loginEmail}, function(err, member){
		if(err) console.log('writeInterview err', err);
		if(!member) console.log('writeInterview not foudn member');
		
		ActivityModel.findOne( {'seq': activitySeq}, function(err, activity){
			if(err) console.log('writeInterview ActivityModel err', err);
			if(!activity) console.log('writeInterview not found activity');			
			var interview = new InterviewModel({
				'writer' : member.seq,
				'term' : term,
				'writeDate' : writeDateStr,
				'level' : level,
				'result' : result,
				'question' : question,
				'answer' : answer,
				'way' : way,
				'companyLogo' : activity.companyLogo,
				'companyName' : activity.companyName,
				'activityName' : activity.name,
				'actClass' : activity.actClass,
				'activitySeq': activitySeq
			});
			interview.save(function(err, doc){
				if(err) console.log('err', err);
				
				point = member.point + addPoint;
				member.update({$set:{'point':point}}, function(err){
					if(err) callback({error:'member update point error'});
				});

				// interview관련 activity 수정
				var totalLevel = activity.totalInterLevel * activity.totalInterCount;
				activity.totalInterLevel = Math.round(( totalLevel + level ) / ++activity.totalInterCount);

				activity.save(function(err){
					if(err) callback( {error: 'database fail write interview activity '});
					
					var obj = { "status": "OK" }
					callback(obj);
				}); // activity.save
			}); // interview.save
		}); // ActivityModel
	});
}	// writeInterview


exports.createInterview = function(callback){
	var activitySeq = 2;
	ActivityModel.findOne( {'seq': activitySeq}, function(err, activity){
		if(err) return res.status(500).json( {error: 'database error createInterview' });
		var tmpCompanyLogo = activity.companyLogo;
		var tmpCompanyName = activity.companyName;
		var tmpActivityName = activity.activityName;

		var interview = new InterviewModel({
			writer: 12,
			term: "2016 상반기",
			question: "자기소개하세요.자기소개하세요.자기소개하세요.자기소개하세요.자기소개하세요.자기소개하세요.자기소개하세요.자기소개하세요.자기소개하세요.자기소개하세요.자기소개하세요.자기소개하세요.자기소개하세요.자기소개하세요.자기소개하세요.자기소개하세요.자기소개하세요.자기소개하세요.자기소개하세요.",
			answer: "자기소개는 이렇습니다.자기소개는 이렇습니다.자기소개는 이렇습니다.자기소개는 이렇습니다.자기소개는 이렇습니다.자기소개는 이렇습니다.자기소개는 이렇습니다.자기소개는 이렇습니다.자기소개는 이렇습니다.자기소개는 이렇습니다.자기소개는 이렇습니다.자기소개는 이렇습니다.자기소개는 이렇습니다.자기소개는 이렇습니다.자기소개는 이렇습니다.자기소개는 이렇습니다.",
			way: "PT/면접",
			companyLogo: tmpCompanyLogo,
			companyName: tmpCompanyName,
			activityName: tmpActivityName,
			activitySeq: activitySeq
		});
		interview.save( function(err, doc){
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




exports.insertInterview = function(req, callback){

	var point;
	var addPoint = 10;

	var loginEmail = req.session.loginEmail;
	loginEmail = 'admin';

	var term = req.body.term;
	var level = (req.body.level*1);
	var result = req.body.result;
	var question = req.body.question;
	var answer = req.body.answer;
	var way = req.body.way;
	var activitySeq = req.body.activitySeq;

	var date = new Date;
	var writeDateStr = date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate();

	MemberModel.findOne({'loginEmail': loginEmail}, function(err, member){
		if(err) callback({error:'database membermodel error'});
		if(!member) callback({error:'not found member'});
		
		ActivityModel.findOne( {'seq': activitySeq}, function(err, activity){
			if(err) callback( {error: 'database fail write interview activity' });
			var interview = new InterviewModel({
				'writer' : member.seq,
				'term' : term,
				'writeDate' : writeDateStr,
				'level' : level,
				'result' : result,
				'question' : question,
				'answer' : answer,
				'way' : way,
				'companyLogo' : activity.companyLogo,
				'companyName' : activity.companyName,
				'activityName' : activity.name,
				'actClass' : activity.actClass,
				'activitySeq': activitySeq
			});
			interview.save(function(err, doc){
				if(err) console.log('err', err);
				
				point = member.point + addPoint;
				member.update({$set:{'point':point}}, function(err){
					if(err) callback({error:'member update point error'});
				});

				console.log('interview Leve; = ', level);
				// interview관련 activity 수정
				var totalLevel = activity.totalInterLevel * activity.totalInterCount;
				activity.totalInterLevel = Math.round(( parseInt(totalLevel) + parseInt(level) ) / ++activity.totalInterCount);

				console.log('interview total level = ', totalLevel);
				console.log('activity.totalInterLevel=', activity.totalInterLevel);

				activity.save(function(err){
					if(err) callback( {error: 'database fail write interview activity '});
					
					var obj = { "status": "OK" }
					callback(activitySeq);
				}); // activity.save
			}); // interview.save
		}); // ActivityModel
	});
}


exports.webDetailInterview = function(seq, activitySeq, callback){
	ActivityModel.findOne({'seq':activitySeq}, function(err, activity){
		if(err) callback({error:'updateInterview error'});

		InterviewModel.findOne({'seq':seq}, function(err, interview){
			if(err) callback({error:'updateInterview error interview'});

			var obj = {
				"activity": activity,
				"interview": interview
			}
			callback(obj);
		});	// Interview
	});	// ActivityModel
}


exports.updateInterview = function(req, callback){

	var level = req.body.level;
	var term = req.body.term;
	var result = req.body.result;
	var question = req.body.question;
	var answer = req.body.answer;
	var way = req.body.way;

	var seq = req.body.seq;
	var activitySeq = req.body.activitySeq;
	
	InterviewModel.findOne({'seq':seq}, function(err, interview){
		if(err) console.log('err', err);

		interview.level = level;
		interview.term = term;
		interview.result = result;
		interview.questoin = question;
		interview.answer = answer;
		interview.way = way;

		interview.save(function(err, doc){
			if(err) console.log('interview save err', err);
			callback(activitySeq);
		});
	});
}	// updatePostscript


exports.deleteInterview = function(seq, callback){
	InterviewModel.remove({'seq':seq}, function(err){ if(err) console.log('del err', err); callback("OK"); });
}