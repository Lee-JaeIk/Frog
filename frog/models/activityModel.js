// activity
var db = require('../models/db');
var async = require('async');
var moment = require('moment');

var mongoose = require('mongoose'),
Schema = mongoose.Schema,
autoIncrement = require('mongoose-auto-increment');

var connection = mongoose.createConnection("mongodb://localhost/testFrog");
autoIncrement.initialize(connection);

var ActivitySchema = new mongoose.Schema({
	seq : Number,
	name : String,
	hit: { type:Number, default:0 },
	origin_endDate: { type:Date, default: Date.now },
	endDate: { type:String, default:"D-" },
	origin_startDate: { type:Date, default: Date.now },
	startDate: { type:String, default:"YYYY-MM-DD" },
	averageRate : { type:Number, default:0 },	
	actClass : { type:String, default:"전체" },
	indus : { type:String, default:"전체"},
	term : { type:String, default:"전체"},
	during: { type:Number, default:0},
	strDuring: { type:String, default:"전체" },
	region : { type:String, default:"전체"},
	totalPostCount : { type:Number, default:0 },
	totalPostCountStar : { type:Array, default:[0,0,0,0,0] },	
	totalInterCount : { type:Number, default:0 },
	totalInterLevel : { type:Number, default:0 },
	guideImg : { type:String, default:"guideImg" },
	recruitImg : { type:String, default:"recruitImg" },
	companyName : { type:String, default: "companyName" },
	companyLogo : { type:String, default: "companyLogo" }
});

ActivitySchema.plugin(autoIncrement.plugin, {model: 'Activity', field: 'seq'});
mongoose.model('Activity', ActivitySchema);


require('../models/likeactivityModel');
var LikeActivityModel = db.model('LikeActivity');

require('../models/interviewModel');
var InterviewModel = db.model('Interview');

require('../models/postscriptModel');
var PostScriptModel = db.model('PostScript');

require('../models/memberModel');
var MemberModel = db.model('Member');

var ActivityModel = db.model('Activity');

var statusOk = { "status": "OK" };
var statusFail = { "status": "Fail" };
var statusNoSearch = { "status": "nosearch" };






// ************************** Activity만을 보여줄 때 ************************** //

var activityPageValue = 2;
var conditionsActivityValue = 3;
var highStarActivityValue = 4;
var highRateActivityValue = 5;
var recommandListValue = 6;


// ************************** homePage ************************** //
exports.homePage = function(result_callback){
	
	var activityArr = [];
	var tmpActivity;

	InterviewModel.findOne(function(err, interview){
		if(err) console.log('homePage InterviewModel err ', err);
		if(!interview) console.log('homePage not found interview');

		PostScriptModel.findOne({'seq':25}, function(err, postscript){
			if(err) console.log('homePage Postscript err ', err);
			if(!postscript) console.log('homePage not found postscript');

			ActivityModel.find(function(err, activity){
			// ActivityModel.find({$or:[{'seq':11}, {'seq':28}]}, function(err, activity){
				if(err) console.log('homePage ActivityModel err ' , err);
				if(!activity) console.log('homePage not found activity');
				var activity = { "activity": activity }
				var tmpObj = {
					"interview": interview,
					"postscript": postscript,
					"activities":  activity
				}
				var obj = {
					"title": "홈 화면",
					"result": tmpObj
				}
				console.log('homeObj', obj);
				result_callback(obj);           
			}).sort( {'averageRate':1} ).limit(2);			
		}).sort({'goodCount': 1}).limit(1); // PostScriptModel       
	}).sort({'goodCount': -1}).limit(1); // InterviewModel
}


exports.getActivity = function(req, division, result_callback){
	var activityArr = [];
	var tmpActivity;
	var title;

	var division = division;
	var loginEmail = req.session.loginEmail;

	// condition
	var actClassValue = req.body.actClass;
	var indusValue = req.body.indus;
	var duringValue = req.body.term;
	var regionValue = req.body.local;

	if( actClassValue == "null" || actClassValue == "전체" ) actClassValue = '';
	if( indusValue == "null" || indusValue == "전체" ) indusValue = '';
	if( duringValue == "null" || duringValue == "전체" ) duringValue = '';
	if( regionValue == "null" || regionValue == "전체" ) regionValue = '';

	// recommand
	var result;
	var max=0, current=0, index=0;

	async.waterfall([
		function(callback){
			switch(division){
				case activityPageValue:
					title = "대외활동 페이지";
					
					ActivityModel.find( function(err, activity ){
						if(err) console.log('getActivity activityPageValue err ' , err);
						if(!activity) console.log('getActivity activityPageValue not found activity');
						callback(null, activity);
					}).sort({'origin_endDate':1});

				break;
				case conditionsActivityValue:

					ActivityModel.find({$and:[  {'actClass':{$regex:actClassValue}}, {'indus':{$regex:indusValue}}, {'strDuring':{$regex:duringValue}}, {'region':{$regex:regionValue}}    ]}, function(err, activity){
						if(err) console.log('getCondition Err', err);
						if(!activity) console.log('getActivity/conditionsActivityValue not found activity');

						callback(null, activity);
					}).sort( {'origin_endDate':1});	

				break;
				case highStarActivityValue:
					title = "별점 높은 순";
				
					ActivityModel.find({$and:[  {'actClass':{$regex:actClassValue}}, {'indus':{$regex:indusValue}}, {'strDuring':{$regex:duringValue}}, {'region':{$regex:regionValue}}    ]}, function(err, activity){
						if(err) console.log('getActivity/highStarActivityValue err ', err);
						if(!activity) console.log('getActivity/highStarActivityValue not found activity');
						console.log('activity-highStartActivityValue activity', activity);
						callback(null, activity);
					}).sort({'averageRate':-1}).sort( {'origin_endDate':1});	

				break;
				case highRateActivityValue:
					title = "포스팅 많은 순";
				
					ActivityModel.find({$and:[  {'actClass':{$regex:actClassValue}}, {'indus':{$regex:indusValue}}, {'strDuring':{$regex:duringValue}}, {'region':{$regex:regionValue}}    ]}, function(err, activity){
						if(err) console.log('getActivity/highRateActivityValue err ' , err);
						if(!activity) console.log('getActivity/highRateActivityValue not found activity');
						console.log('activity-highRateActivityValue activity', activity);
						callback(null, activity);
					}).sort({'totalPostCount':-1}).sort( {'origin_endDate':1});	

				break;
				case recommandListValue:
					title = "대외활동 추천";

					MemberModel.findOne({'loginEmail':loginEmail}, function(err, member){
						if(err) console.log('activity-getActClass error', err);
						if(!member) console.log('activity-getActClass not found member');

						for( var i=0 ; i<member.actClass.length ; i++ ){
							current = member.actClass[i] + member.likeActClass[i];
							if( current >= max ) {
								max = current;
								index = i;
							}
						}	// for

						switch(index){
							case 0: 	result="전체";	 	break;
							case 1: 	result="해외탐방";	break;
							case 2: 	result="국내봉사";	break;
							case 3: 	result="해외봉사";	break;
							case 4: 	result="강연"; 		break;
							case 5: 	result="멘토링";	 	break;
							case 6: 	result="서포터즈";	break;
							case 7: 	result="마케터"; 	 	break;
							case 8: 	result="홍보대사";	break;
							case 9: 	result="기자단"; 	 	break;
							case 10: 	result="기획단"; 	 	break;
							case 11: 	result="기타"; 	 	break;		
						}	// switch

						ActivityModel.find({'actClass': result}, function(err, activity){
							if(err) console.log('activity-getActivity recommandList ActivityModel err', err);
							if(!activity) console.log('activity-getActivity recommandList not found activity');
							callback(null, activity);
						});
					});	// MemberModel	
				break;
			}
		},
		function(activities, callback){
			async.eachSeries(activities, function(item, cb){
				activityArr.push(item);
				cb();            
			}, function(err){
				if(err) console.log('err', err);
				tmpObj = { "activity": activityArr }
				callback(null, tmpObj );
			}); // async.each
		} // function
	], // waterfall
	function(err, result){
		if(err) console.log('err', err);
		var obj = {
			"title": title,
			"activities": result
		}                   
		result_callback(obj);
	}); //async
}	


exports.homeSearch = function(search, callback){
	console.log('Function getActivity searchActivity search', search);
	
	ActivityModel.findOne( {'name': search}, function(err, activity){
		if(err) console.log('homeSearch err', err);
		if(!activity) callback(statusNoSearch);
		else{
			
			var obj = {
				"title": "홈화면 검색",
				"status": "OK",
				"activity": activity			
			}
			console.log('homeSearch obj=', obj);
			callback(obj);
		}
	}).limit(1);
}


exports.detailActivityHeader = function(activitySeq, memSeq, callback){

	ActivityModel.findOne( {'seq':activitySeq}, function(err, activity){
		if(err) console.log('detailActivityHeader err', err);
		if(!activity) console.log('detailActivityHeader not found activity');
		else{
			LikeActivityModel.findOne( {$and: [{'activitySeq':activitySeq}, {'member':memSeq}]}, function(err, likeActivity){
				var tmpObj;
				if(err) console.log('detailActivityHeader LikeActivityModel err', err);
				if(!likeActivity){
					tmpObj = {
		  				"check": 0,
		  				"member": memSeq,
		  				"activity": activity
					}
				}else{
					tmpObj = {
		  				"check": likeActivity.check,
		  				"member": memSeq,
		  				"activity": activity
					}
				}

				var obj = { 
					"title": "대외활동 윗부분",
					"result": tmpObj 
				}      
				callback(obj);
			}); // LikeActivityModel
		}
	});	// ActivityModel
} // detailActivityHeader









// ********************** Detail Activity Page ********************** //
exports.detailActivityGuide = function(activitySeq, callback){
	console.log('detailActivityGuide');

	ActivityModel.findOne( {'seq': activitySeq}, function(err, activity){
		if(err) console.log('detailActivityGuide err', err);
		if(!activity) console.log('detailActivityGuide not found activity');
		else{
			var obj = {
			  "title": "모집요강",
			  "activity": activity
			}
			callback(obj);
		}
	});
}	// detailActivityGuide


// ActivitySeq의 Interview List
exports.detailActivityInterviews = function(activitySeq, callback){
	console.log('detailActivityInterview');
	console.log('detail Activity Interview activitSeq = ', activitySeq);

	ActivityModel.findOne( {'seq':activitySeq}, function(err, activity){
		if(err) console.log('detailActivityInterviews err', err);
		if(!activity) console.log('detailActivityInterviews not found activity');
		else {

			InterviewModel.find( {'activitySeq': activitySeq}, function(err, interview){
				if(err) console.log('detailActivityInterviews interview err', err);
				if(!interview) console.log('detailActivityInterviews not found interview');

				var interviewObj = { "interview": interview }
				var obj = { 
					'title': "면접후기 리스트",
					'totalInterCount': activity.totalInterCount,
					'totalInterLevel': activity.totalInterLevel,
					'interviews': interviewObj
				}      
				callback(obj);
			}).sort({ 'origin_writeDate': -1 }); // InterviewModel
		}	// else
	}); // ActivityModel
}	// detailActivityInterview


exports.detailActivityPostscripts = function(activitySeq, callback){
	var postscriptObj;

	ActivityModel.findOne( {'seq':activitySeq}, function(err, activity){
		if(err) console.log('detailActivityPostscripts err', err);
		if(!activity) console.log('detailActivityPostscripts not found activity');
		else{
			PostScriptModel.find( {'activitySeq': activitySeq}, function(err, postscript){
				if(err) console.log('detailActivityPostscripts postscript err', err);
				if(!postscript) console.log('detailActivityPostscripts not found postscript');
				else{
					postscriptObj = { "postscript": postscript }
					var obj = { 
						'title': "활동후기 리스트",
						'averageRate': activity.averageRate,
						'totalPostCountStar': activity.totalPostCountStar,
						'totalPostCount': activity.totalPostCount,
						'postscripts': postscriptObj 
					}
					callback(obj);
				}
			}).sort( {'origin_writeDate': -1}); // PostScriptModel
		}
	}); // ActivityModel
}	// detailActivityPostscripts


exports.nameList = function(result_callback){
		
	var activityName = [];	
	var i=0;

	async.waterfall([
		function(callback){
			ActivityModel.find(function(err, activity){
			if(err) console.log('nameList err', err);
			if(!activity) console.log('nameLi not found activity');
			callback(null, activity);
		});
	},
	function(activities, callback){
		async.eachSeries(activities, function(item, cb){
	  		activityName.push(activities[i++].name);
	  		cb();
		}, function(err){
	  		if(err) console.log('err', err);
	  		callback(null, activityName );
		}); // async.each
	} // waterfall
	],
	function(err, result){
		if(err) console.log('err', err);
			var obj = {
				"title": "대외활동 명 리스트",
				"activityName": result
			}
		result_callback(obj);
	});  
}


exports.getFormActivity = function(seq, callback){
	console.log('seq', seq);

	ActivityModel.findOne({'seq':seq}, function(err, activity){
		if(err) console.log('activityModel - getActivity ActivityModel err', err);
		if(!activity) console.log('activity-getActivity not found activity');
		
		var obj = {
			"status": "OK",
			"activity": activity
		}
		callback(obj);
	});	// ActivityModel
}	// getActivity ( for detailActivity Page )






// ******************* Function ******************* // 
function calDate_dDay(endDate){  	
  	
	var today = new Date();	
	var tmpEndDate = new Date(endDate);

	console.log('today / endDate = ', tmpEndDate);
	var days = (today - endDate) / 1000 / 60 / 60 / 24;
	var result = Math.floor(days);

	console.log('1---------------------------------------1 result = ', result);
	if(result > 0 ) result = "D+"+result;
	else if(result == 0 ) result = "D-Day";
	else result = "D"+result;

	return result;
}

function calDuring(during){
  var num = parseInt(during);
  var result;
  if(num < 30) result = "1개월";
  else if( num < 90 ) result = "1~3개월";
  else if( num < 150 ) result = "3~5개월";
  else result = "6개월~";
  return result;
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


exports.insertActivity = function(req, guideImgPath, recruitImgPath, companyLogoPath, callback){
	console.log('activityModel insertActivity');
	
	var now = moment(new Date(req.body.origin_startDate));	 
	var startDate = now.format('YYYY-MM-DD');
	
	var dDay = calDate_dDay(req.body.origin_endDate);
	var strDuring = calDuring(req.body.during);


	var activity = new ActivityModel({
		'name': req.body.name,
		'origin_endDate': new Date(req.body.origin_endDate),
		'endDate': dDay,
		'origin_startDate': new Date(req.body.origin_startDate),
		'startDate': startDate,
		'actClass': req.body.actClass,
		'term': req.body.term,
		'during': req.body.during,
		'strDuring': calDuring(req.body.during),
		'region': req.body.region,						// string으로 입력받고 포함하는 걸로 검색하라.
		'guideImg': guideImgPath,
		'recruitImg': recruitImgPath,
		'companyLogo': companyLogoPath,
		'companyName': req.body.companyName
	});
	activity.save(function(err, doc){
		if(err) callback({error:'insertActivity error'});

		console.log('insertActivity doc', doc);
		callback(doc);
	});
}	// insertActivity

exports.activityList = function(callback){

	var tmpActivity;
	var activityArr = [];
	
	ActivityModel.find(function(err, activity){
		if(err) callback({error:'activityModel err activityList'});					
		if(!activity) callback( {error: 'activity not found activityModel err activityList'});
		var tmp = { "activity": activity }
		var obj = {
			"title": "ActivityList",
			"result": tmp
		}
		callback(obj);
	}).sort( {'seq':1});	
	
	
}	//	activityList

exports.webGetActivity = function(seq, callback){
	console.log('seq', seq);

	ActivityModel.findOne({'seq':seq}, function(err, activity){
		if(err) callback({error:'getActivity error activity'});
		if(!activity) callback({error:'not found activity'});

		PostScriptModel.find({'activitySeq':seq}, function(err, postscript){
			if(err) callback({error:'getActivity error postscript'});

			InterviewModel.find({'activitySeq':seq}, function(err, interview){
				if(err) callback({error:'getActivity error interview'});				
				var obj = {
					"activity": activity,
					"postscript": postscript,
					"interview": interview
				}
				callback(obj);
			});	// InterviewModel
		});	// PostScriptModel
	});	// ActivityModel
}	// getActivity ( for detailActivity Page )


exports.findOneActivity = function(seq, callback){
	ActivityModel.findOne({'seq': seq}, function(err, activity){
		if(err) callback({error:'db error findOneActivity'});
		var obj = { "activity": activity }
		callback(obj);
	});
}	// findOneActivity
