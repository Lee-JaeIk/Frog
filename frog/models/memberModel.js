// memberModel
var db = require('../models/db');
var async = require('async');
var FB = require('fb');


var mongoose = require('mongoose'),
Schema = mongoose.Schema,
autoIncrement = require('mongoose-auto-increment');

var connection = mongoose.createConnection("mongodb://localhost/testFrog");
autoIncrement.initialize(connection);

var MemberSchema = new mongoose.Schema({
	seq : Number,
	loginEmail : { type:String, default:"loginEmail@loginmail.com"},
	pwd : { type:String, default:"password"},
	univEmail : { type:String, default:"Univ@mail.com"},
	provisionCheck : { type:Number, default:0},	// 대학교 인증
	quotationCheck : { type:Number, default:0},
	point : { type:Number, default:100},
	actClass : { type:Array , default:[0,0,0,0,0,0,0,0,0,0,0,0] },
	likeActClass : { type:Array , default:[0,0,0,0,0,0,0,0,0,0,0,0] },
	indus : { type:Array, default:[0,0,0,0,0,0,0,0,0,0,0] },
	pushAlarm : { type:Number, default: 0 },					// 전체push 받을지 여부체크
	recommandPushAlaram : { type:Number, default: 0 },			// 추천push 
	likePushAlarm : { type:Number, default:0 },					// 찜활동push
	gcmToken : { type:String, default:"" },
	facebookToken : { type:String, default:"" },
	adminCheck : { type:Number, default:0 }
});

MemberSchema.plugin(autoIncrement.plugin, {model: 'Member', field: 'seq'});
mongoose.model('Member', MemberSchema);

var MemberModel = db.model('Member');

require('../models/likeactivityModel');
var LikeActivityModel = db.model('LikeActivity');

require('../models/activityModel');
var ActivityModel = db.model('Activity');

require('../models/postscriptModel');
var PostscriptModel = db.model('PostScript');

require('../models/interviewModel');
var InterviewModel = db.model('Interview');

require('../models/provisionModel');
var ProvisionModel = db.model('Provision');

var statusOk = { "status": "OK" };
var statusFail = { "status": "Fail" };
var statusNotFound = { "status": "Not Found Object" };
var sessionNotFound = false;

var statusNotApproval = { "status": "notApproval" };
var statusNotConfirm = { "status": "notConfirm" };	
var notFoundMail = { "status": "NotFoundMail" };


// ************************* My Page ************************* //
exports.myPage = function(req, callback){

	var activityArr = [];
	var tmpMember;
	var loginEmail = req.session.loginEmail;
	var memSeq;

	async.waterfall([
		function(callback){
			MemberModel.findOne( {'seq':memSeq}, function(err, member){					// point를 얻기 위해 MemberModel을 find
				if(err) console.log('member-myPage MemberModel err', err);
				if(!member) console.log('member-myPage not found member');
				else{
					tmpMember = { "point": member.point }
					memSeq = member.seq;
					callback(null);																// error가 없다면 다음 function으로
				}
			});
		},
	function(callback){
		LikeActivityModel.find( {$and: [{'member': memSeq}, {'check':1}]}, function(err, likeActivity){			// memSeq의 찜한 대외활동을 가져온다.
			if(err) console.log('myPage LikeActivityModel err', err);
			if(!likeActivity) console.log('myPage LikeActivityModel not found likeActivity');
			callback(null, likeActivity);												// error가 없다면 찜한 대외활동과 함께 다음 function으로
		}).limit(3);
	},
	function(likeActivities, callback){
		async.eachSeries(likeActivities, function(item, cb){							// 찜한 대외활동을 for문 한다.
			ActivityModel.findOne( {'seq':item.activitySeq}, function(err, activity){	// 찜한 대외활동의 정보를 가져온다.
	    		if(err) console.log('myPage ActivityModel err', err);
	    		if(!activity) console.log('myPage not found activity');
	    		activityArr.push(activity);													// activityArr배열에 activity를 push한다.
	    		cb();																		// callback 함수 cb()를 실행
			}); // activityModel
	}, function(err){
			if(err) console.log('err', err);		
			var tmpObj = { "activity": activityArr }
			callback(null, tmpObj );													// err가 없다면 tmpObj를 callback함수로 넘겨라.
		}); // async.each
	}	// waterfall-err 
	],	// waterfall
	function(err, result){																// 결과값을 받는다.
		if(err) console.log('err', err);
		var obj = {
			"title": "마이페이지",
			"point": tmpMember.point,
			"activities": result
		}	
		callback(obj);																	// myPage의 callback함수로 넘긴다. 즉, myPage를 부른 곳으로 넘긴다.
	});
}	// my Page









// ************************* Write ************************* //
exports.myPostscripts = function(memSeq, callback){

	PostscriptModel.find( {'writer': memSeq}, function(err, postscript){
		if(err) console.log('member postscripts err', err);
		if(!postscript) console.log('postscrips not found postscripts');
		else{
			var postscriptObj = { "postscript": postscript }
			var obj = { 
				"title": "마이페이지 활동후기",
				"totalPostCount": postscript.length,
				"postscripts": postscriptObj
			}
			callback(obj);
		}
	});	// PostscriptModel
}	// postscripts


exports.myInterviews = function(req, callback){
	var loginEmail = req.session.loginEmail;
	MemberModel.findOne({'loginEmail': loginEmail}, function(err, member){
		if(err) console.log('member-myInterview err', err);
		if(!member) console.log('member-myInterview not found member');
		else{
			InterviewModel.find( {'writer': member.seq}, function(err, interview){
				if(err) console.log('member-interviews err', err);
				if(!interview) console.log('member-interviews not found interview');
				else{
					var interviewObj = { "interview": interview }
					var obj = { 
						"title": "마이페이지 인터뷰",
						"totalInterCount": interview.length,
						"interviews": interviewObj
					}
					callback(obj);
				}
			});	// Interview
		}	// if(!member)-else
	});	// Member
}


exports.moreActivity = function(req, result_callback){

	var activityArr = [];
	var loginEmail = req.session.loginEmail;
	async.waterfall([
		function(callback){
			MemberModel.findOne({'loginEmail': loginEmail}, function(err, member){
				if(err) console.log('member-moreActivity MemberModel err', err);
				if(!member) console.log('member-moreActivity not found member');
				else{
				    LikeActivityModel.find( {$and: [{'member': member.seq}, {'check':1}]}, function(err, likeActivity){
			      		if(err) console.log('member-moreActivity LikeActivityModel err', err);
			      		if(!likeActivity) console.log('member-moreActivity not found likeActivity');
			      		callback(null, likeActivity);
			    	});
				}
			});
	}, 
	function(likeActivities, callback){
	  	async.eachSeries(likeActivities, function(item, cb){
	    	ActivityModel.findOne( {'seq':item.activitySeq}, function(err, activity){
		        if(err) console.log('member-moreActivity ActivityModel err', err);
		        if(!activity) console.log('member-moreActivity not found activity');
		        activityArr.push(activity);
	        	cb();
	    	}); // ActivityModel
	  	}, 
	  	function(err){
		    if(err) console.log('err', err);
	    	var tmpObj = { "activity": activityArr }
	    	callback(null, tmpObj );
	  	}); // async.each
	}	// function(likeActivities);
	], function(err, result){
			if(err) console.log('member-moreActivity result err', err);
			var obj = {
	  			"title": "찜 대외활동 더보기",
	  			"activities": result
			}
		result_callback(obj);
	});	// waterfall
}	// moreActivity


exports.pointCheck = function(req, activitySeq, callback){
	
	var loginEmail = req.session.loginEmail;
	MemberModel.findOne( { 'loginEmail':loginEmail }, function(err, member){
		if(err) console.log('member-pointCheck MemberModel err', err);
		if(!member) console.log('member-pointCheck not found member');
		
		if(member.point > 1){
			member.point -= 1;
			member.save(function(err){
				if(err) callback( {error: 'database fail member point '});          
			});	// member.save
			
			var obj = {
				"seq": activitySeq,
				"status": "OK"
			}

			callback(obj);
		}else callback(statusFail);
	});	// MemberModel
}	// pointCheck









// ************************** actCalss / indus / during / region ************************** //
// ************************** actClass ************************** //
exports.myActClass = function(memSeq, callback){

	MemberModel.findOne( {'seq':memSeq}, function(err, member){
		if(err) console.log('member-myActClass MemberModel err', err);
		if(!member) console.log('member-myActClass not found member');

		var obj = { "actClass": member.actClass }
		callback(obj);
	}); // MemberModel
}	// myActClass

exports.myActClassChange = function(memSeq, data, callback){
	
	var all = data.all;
	MemberModel.findOne( {'seq':memSeq}, function(err, member){
		if(err) console.log('member-myActClassChange MemberModel err', err);
		if(!member) console.log('member-myActClassChange not found member');

		for( var i=1 ; i<=11; i++ ){
			if( all == "true" ){		// true값만 변경
				member.actClass[i]++;
				continue;
			}else{
				if(data.item[i] == "true" ) member.actClass[i]++;
				else member.actClass[i] = 0;
			}
		}  

		if( all == "true" ) member.actClass[0] = 1;	// 전체 선택이면 모두 1로 변경
		else member.actClass[0] = 0;

		member.update({$set:{'actClass':member.actClass}}, function(err){
			if(err) console.log('myActClassChange member.update err', err);
			callback(statusOk);
		}); // member.update    
	}); // MemberModel.findOne
}	// myActClassChange


// ************************** indus ************************** //
exports.myIndus = function(memSeq, callback){
	
	MemberModel.findOne( {'seq':memSeq}, function(err, member){
		if(err) console.log('member-myIndus MemberModel err', err);
		if(!member) console.log('member-myIndus not found member');

			var obj = { "indus": member.indus }
			callback(obj);
	}); // MemberModel
}	// myIndus


exports.myIndusChange = function(memSeq, data, callback){

	var all = data.all;
	MemberModel.findOne( {'seq':memSeq}, function(err, member){
		if(err) console.log('member-myIndusChange MemberModel err', err);
		if(!member) console.log('member-myIndusChange not found member');
		for( var i=1 ; i<=10 ; i++ ){
			console.log('member.indus i', i, member.indus[i]);
			if( all == "true" ) member.indus[i] = 1;   // 전체 선택을 했을 경우 
			else{
				if( data.item[i] == "true" ) member.indus[i] = 1;
				else member.indus[i] = 0;
			}
		} // for

		if( all == "true") member.indus[0] = 1; // 전체선택이면 모두 1로 변경
		else member.indus[0] = 0;

		member.update({$set:{'indus':member.indus}}, function(err){
			if(err) console.log('member-myIndusChange member.update err', err);
			callback(statusOk);
		}); // member.update    
	}); // MemberModel
}	// myInudsChange









// ************************** Login & SignUp & CheckMail ************************** //
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport('smtps://testfrog2@gmail.com:dlworwor2@smtp.gmail.com');

exports.signUp = function(req, callback){

	var loginEmail = req.body.email;
	var pwd = req.body.pwd;
	
	console.log('loginEmail = ', loginEmail);
	var statusFailMail = { "status": "Fail", "message": "이메일 중복" };

	// 이메일 중복 체크 O
	// 이메일 인증 O

	MemberModel.findOne( {'loginEmail':loginEmail}, function(err, member){
		if(err) console.log('member-signUp MemberModel err', err);
		if(!member){	// 회원이 아니라면 

			var num = generateRandom();														// 난수를 발생시키고,
			var mailTitle = "[우물밖 개구리] 메일을 인증해주세요.";									// 메일 제목을 정하고,
			var htmlText = '<a href="http://52.79.179.176:3000/checkMail/'+loginEmail+'/'+num+'">Click!! 🐴</b>'; // 메일 주소와 함께 난수링크를 보냄.

			console.log('htmlText', htmlText);

			// 보낼 메일을 설정하고
			var mailOptions = {
				from: '"[우물밖 개구리]" <testfrog2@gmail.com>', // sender address
				to: loginEmail, // list of receivers
				subject: mailTitle, // Subject line
				html: htmlText
			};


			// 메일을 보낸다.
			transporter.sendMail(mailOptions, function(error, info){
				if(error) console.log('member-signUp sendMail err', err);

				ProvisionModel.findOne({'loginEmail':loginEmail}, function(err, provision){
  					if(err) console.log('member-signUp ProvisionModel err', err);
  					if(!provision){																	// 처음으로 인증메일을 보내면
    					var tmpProvision = new ProvisionModel({
      						loginEmail: loginEmail,
      						pwd: pwd,
      						num: num
    					});
    					tmpProvision.save();														// 인증메일을 저장하고,
  					}else{
    					provision.pwd = pwd;
    					provision.num = num;
    					provision.save();														    // 보낸적이 있으면 업데이트
  					}
  					callback(statusOk);
				});	// ProvisionModel
			}); // transporter.snedMail
		}else return callback(statusFailMail);    													// 이메일 중복
	}); // MemberModel
}


exports.sendUnivMail = function(req, callback){
	
	var email = req.session.loginEmail;  
	var univMail = req.body.studentEmail;

	var length = univMail.length;
	var index = univMail.lastIndexOf(".");
	var subAC = univMail.substring(index-2, length-3)+"";

	if(subAC=="ac"){

		// 메일 보내고  // 대학생 메일 인증
		var mailTitle = "[우물밖 개구리] 메일을 인증해주세요.";
		var htmlText = '<a href="http://52.79.179.176:3000/checkUnivMail/'+email+'">Click!! 🐴</b>'; // html body

		console.log('대학교 이메일 발송');    
		console.log('htmlText', htmlText);

		// 메일발송 설정
		var mailOptions = {
			from: '"[우물밖 개구리]" <testfrog2@gmail.com>', // sender address
			to: univMail, // list of receivers
			subject: mailTitle, // Subject line
			html: htmlText
		};  

		// 메일 발송
		transporter.sendMail(mailOptions, function(error, info){
			if(error) res.json(statusFail);      // 메일발송 오류
			callback(statusOk);
		}); // transporter.snedMail
	}
	else{
		callback(statusFail); // 대학교 이메일이 아니다.
	}
}	// sendUnivMail


exports.login = function(req, callback){

	var email = req.body.email;
	var token = req.body.gcmToken;
	var pwd = req.body.pwd;

	// email을 통해 아이디 존재 확인 O
	// pwd 확인 O
	// 세션처리

	MemberModel.findOne( {'loginEmail':email}, function(err, member){
		if(err) console.log('member-login MemberModel err', err);
		if(!member) callback(notFoundMail);    // 이메일 존재유무 판단
		else{
			if( pwd == member.pwd ){  // 비밀번호 확인
				// 세션처리    
				console.log('aaa');
				console.log('email', email);
				console.log('req', req);
				console.log('req.session', req.session);
				req.session.loginEmail = email;
				console.log('login-req.session.loginEmail=', req.session.loginEmail);

				member.update({$set:{'gcmToken':token}}, function(err){
					if(err) console.log('member-login member.update err', err);

					if(member.quotationCheck == 0 ) callback(statusNotApproval);
					else if(member.provisionCheck == 0 ) callback(statusNotConfirm); 
					else callback(statusOk);
				});	// member.update
			}else{
				console.log('bbb');
				callback(statusFail);		// 비밀번호가 다르다면 	
			} 
		}
	}); // MemberModel
}


exports.facebookLogin = function(req, callback){

	var gcmToken = req.body.gcmToken;
	var access_token = req.body.accessToken;

	FB.setAccessToken(access_token);
	FB.api('me', { fields: ['id', 'name', 'email'] }, function (res) {
		if(!res || res.error) {
			console.log(!res ? 'error occurred' : res.error);
			callback(statusFail);
		}else{
			var loginEmail = res.email;
			MemberModel.findOne({'loginEmail': loginEmail}, function(err, member){
				if(err) console.log('member-facebookLogin MemberModel err', err);
				if(!member){	// 로그인한 적 없는 페이스북 아이디라면
					// 아이디 등록 후
					var member = new MemberModel({ 
						'loginEmail': loginEmail,
						'gcmToken': gcmToken
					});	
					member.save(function(err, result){ if(err) callback(statusFail); });
				}
				console.log('member=', member);
				console.log('facebook login success');
				
				// 세션처리
				req.session.loginEmail = loginEmail;
				// 아이디 등록하거나 아이디 확인 후 다음화면으로 넘길 결과값 callback
				if(member.quotationCheck == 0 ) {
					var quotationResult = {
						"status": "notApproval",
						"facebookId": res.id
					}
					callback(quotationResult);
				}
				else if(member.provisionCheck == 0 ){
					var provisionResult = {
						"status": "notConfirm",
						"facebookId": res.id
					}
					callback(provisionResult); 
				}
				else{
					var result = {
						"status": "OK",
						"facebookId": res.id
					}
					callback(result);	
				} 
			});	// MemberModel
		}	// if( !res... )
	});	// FB.api	
}	// facebookLogin


exports.logout = function(req, callback){
	
	req.session.destroy(function(err){
		if(err) {
			console.log('err', err);
			var errObj = { "status": "Error" }
			callback(errObj);
		}else callback(statusOk);
	});
}


exports.changePwd = function(req, callback){
	
	var email = req.session.loginEmail;
	var originalPwd = req.body.pwd;
	var changePwd = req.body.changePwd;
	
	// original이 맞는지
	// changePwd와 checkPwd와 같은지
	MemberModel.findOne( {'loginEmail': email}, function(err, member){
		if(err) console.log('member-changePwd MembermModel err', err);
		if(!member) console.log('member-changePwd not found member');

		if( originalPwd == member.pwd ){
			member.update({$set:{'pwd':changePwd}}, function(err){
				if(err) console.log('member-changePwd member.update err', err);
				callback(statusOk); // 바꾸려는 비밀번호 두개가 맞는경우
			}); // member.update        
		}else callback(statusFail); // 기존의 비밀번호가 맞지 않는 경우
	}); // MemberModel
}	// changePwd


exports.sessionCheck = function(req, callback){
	if(!req.session.loginEmail) callback(statusFail);
	else callback(req.session.loginEmail);
}









// ************************** Quotation(약관동의) ************************** //
exports.quotation = function(req, callback){

	var email = req.session.loginEmail;
	var result = req.body.res;
	

	MemberModel.findOne({'loginEmail': email}, function(err, member){
		if(err) console.log('member-quotation MemberModel err', err);
		if(!member) callback(statusNotFound);
		else{
			console.log('quotation member=', member);

			member.update({$set:{'quotationCheck':1}}, function(err){
				if(err) console.log('member-quotation member.update err', err);
				console.log('quotationCheck member', member.quotationCheck);
				callback(statusOk);
			}); // member.update
		}
	}); // MemberModel
}	// quotation


exports.quotationCheck = function(loginEmail, callback){

	var loginEmail = req.session.loginEmail;
	MemberModel.findOne({'loginEmail': loginEmail}, function(err, member){
		if(err) console.log('member-quotationCheck MemberModel err', err);
		if(!member) callback(statusNotFound);

		member.update({$set:{'quotationCheck': 1}}, function(err){
			if(err) console.log('member-quotationCheck member.update err', err);
			callback(member);
		}); // member.update
	}); // MemberModel
}	// quotationCheck


exports.alramCheck = function(req, callback) {
	var mobile = req.body.mobile;
	var notice = req.body.notice;
	var likeAct = req.body.likeAct;

	console.log('1-------------------------------------------1 mobile / notice / likeAct = ', mobile, notice, likeAct);
	var loginEmail = req.session.loginEmail;
	MemberModel.findOne({'loginEmail':loginEmail}, function(err, member) {
		if(err) console.log('member-alaramCheck MemberModel err', err);
		if(!member) console.log('member-alaramCheck not found member');

		console.log('1--------------------------------------------------------------------1 getAlram ', member);
		member.pushAlarm = mobile;
		member.recommandPushAlaram = notice;
		member.likePushAlarm = likeAct;
		member.save(function(err, doc){ console.log('doc=', doc); callback(statusOk); });
	});	// MemberModel
}


exports.getAlram = function(req, callback){
	var loginEmail = req.session.loginEmail;
	console.log('loginEmail = ', loginEmail);

	MemberModel.find({'loginEmail':loginEmail}, function(err, member){
		if(err) console.log('member-getAlram MemberModel err', err);
		if(!member) console.log('member-getAlram not found member');
		else{
			console.log('1--------------------------------------------------------------------1 getAlram ', member);
			var obj = {
				"status": "OK",
				"mobile": member.pushAlarm,
				"notice": member.recommandPushAlaram,
				"likeAct": member.likePushAlarm
			}
			callback(obj);
		}
	});	// MemberModel
}	// getAlram


exports.accountInfo = function(req, callback){
	var loginEmail = req.session.loginEmail;

	MemberModel.findOne({'loginEmail':loginEmail}, function(err, member){
		if(err) console.log('member-accountInfo err', err);
		if(!member) console.log('member-accountInfo not found member');
		else {
			var obj = {
				"status": "OK",
				"email": member.loginEmail,
				"confirmCheck": member.provisionCheck
			}
			console.log('1---------------------------------------------------------------------------1 obj = ', obj);
			callback(obj);
		}
	});
}

exports.getMemberSeq = function(req, callback){

	var loginEmail = req.session.loginEmail;
	if(!loginEmail) callback(sessionNotFound);
	else{
		MemberModel.findOne({'loginEmail':loginEmail}, function(err, member){
			if(err) console.log('member-getMemberSeq MemberModel err', err);
			if(!member) callback(statusNotFound);
			else {
				console.log('member.seq=', member.seq);
				callback(member.seq);
			}
		});
	}
}


exports.autoLogin = function(req, callback){
	
	var loginEmail = req.session.loginEmail;
	if(!loginEmail) {
		console.log('!loginEmail statusFail = ', statusFail);
		callback(statusFail);
	}
	else {
		console.log('loginEmail= statusOk', statusOk);
		callback(statusOk);		
	}
}




function generateRandom() {
  var ranNum = Math.floor(Math.random()*100000);
  return ranNum;
}


exports.createMember = function(callback){
	
	var member = new MemberModel({
		'loginEmail' : 'test9',
		'pwd' : '9',
		"univEmail" : 'test@univ.ac.kr',
		'provisionCheck' : 1,
		'quotationCheck' : 1,
	});
	member.save(function(err, result){
		if(err) callback({error:'database error member'});
		callback(result);
	});
}


exports.getMember = function(seq, callback){
	MemberModel.findOne({'seq':seq}, function(err, member){
		if(err) console.log('err', err);
		callback(member);
	});
}