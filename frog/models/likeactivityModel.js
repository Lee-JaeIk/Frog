// likeactivityModel
var db = require('../models/db');
var async = require('async');
var gcm = require('node-gcm');
var message = new gcm.Message();

var mongoose = require('mongoose'),
Schema = mongoose.Schema,
autoIncrement = require('mongoose-auto-increment');

var connection = mongoose.createConnection("mongodb://localhost/testFrog");

var LikeactivitySchema = new mongoose.Schema({
	seq : Number,
	activitySeq : { type:Number, default:0 },
	member : { type:Number, default: 0},
	check : { type:Number, default: 1}	
});

LikeactivitySchema.plugin(autoIncrement.plugin, {model:'LikeActivity', field:'seq'});
mongoose.model('LikeActivity', LikeactivitySchema);

var LikeActivityModel = db.model('LikeActivity');

require('../models/activityModel');
var ActivityModel = db.model('Activity');

require('../models/memberModel');
var MemberModel = db.model('Member');

require('../models/notificationModel');
var NotificationModel = db.model('Notification');


var statusOk = { "status": "OK" };


exports.likeStatusChange = function(activitySeq, memSeq, callback){
	
	var actClassNum;
	ActivityModel.findOne({'seq': activitySeq}, function(err, activity){
		if(err) console.log('likeStatusChange err', err);

		actClassNum = getActClass(activity.actClass);
		MemberModel.findOne({'seq':memSeq}, function(err, member){
			if(err) console.log('likeStatusChange MemberModel err', err);
			if(!member) console.log('likeStatusChange not found member');

			LikeActivityModel.findOne( {$and: [{'activitySeq':activitySeq}, {'member':memSeq}]}, function(err, likeActivity){
				if(err) console.log('likeStatusChange LikeActivityModel err', err);
				if(!likeActivity){
					var tmpLikeActivity = new LikeActivityModel({
						activitySeq: activitySeq,
						member: memSeq,
						check: 1
					});
					tmpLikeActivity.save( function(err, doc){
						if(err) console.error('likeStatusChange tmpLikeActivity err', err);

						member.likeActClass[actClassNum]++;
						member.update({$set:{'likeActClass': member.likeActClass}}, function(err){
							callback(statusOk);
						});		// member. update
					});  // tmpLikeActivity.save
				}else{
					if( likeActivity.check == 1 ) {
						likeActivity.check = 0;
						member.likeActClass[actClassNum]--;
					}
					else {
						likeActivity.check = 1;
						member.likeActClass[actClassNum]++;
					}

					likeActivity.save( function(err, doc){				
						if(err) console.log('likeStatusChange likeActivity save err', err);
						member.update({$set:{'likeActClass': member.likeActClass}}, function(err){
							if(err) console.log('likeStatusChange member.update err', err);
							callback(statusOk);
						});
					}); // likeActivity.save
				} // else
			}); // LikeActivityModel
		});	// MeberModel
	});	// ActivityModel
}








exports.pushGCM = function(result_callback){
	
	var leftDay, startDay;				// 대외활동의 모집기간 남은날짜와 모집 시작기간
	var sendValue = 1;					// sendValue == 1이면 gcm을 보내고, == 0이면 gcm을 보내지 않는다.
	var memberToken, activityName;		// gcm 받을 멤버의Token과, 알림의 어던 대외활동인지

	var server_api_key = 'AIzaSyBOk2ElT5JT7OV1KnW18qwm9ZYwpJC57-s';	// GCM Server API key
	var sender = new gcm.Sender(server_api_key);

	async.waterfall([
		function(callback){
			LikeActivityModel.find({'check':1}, function(err, likeActivity){
				if(err) console.log('pushGCM LikeActivityModel err', err);
				if(!likeActivity) console.log('pushGCM not found likeActivity');

				callback(null, likeActivity);
			}).sort( {activitySeq: 1} );
		},
		function(likeActivities, callback){
			async.eachSeries(likeActivities, function(item, cb){
				ActivityModel.findOne({'seq':item.activitySeq}, function(err, activity){
					if(err) console.log('pushGCM ActivityModel err', err);
					if(!activity) console.log('pushGCM not found activity');
					else{
						MemberModel.findOne({'seq':item.member}, function(err, member){
							if(err) console.log('pushGCM MemberModel err', err);
							if(!member) console.log('pushGCM not found member');

							// member.alramCheck
							var gcmTmpMessage;
							
							if( activity.startDate == "D-Day" ){
			  					sendValue = 1;
			  					activityName = activity.name;
			  					memberToken = member.gcmToken;							
			  					gcmTmpMessage = "모집시작 D-Day";
							}else if( activity.endDate == "D-Day" ) {
			  					sendValue = 1;
			  					activityName = activity.name;
			  					memberToken = member.gcmToken;
			  					gcmTmpMessage = "모집마갑 D-Day";
			  				}else if ( activity.endDate == "D-3" ){
			  					sendValue = 1;
			  					activityName = activity.name;
			  					memberToken = member.gcmToken;
			  					gcmTmpMessage = "모집마감 D-3";
			  				}else sendValue = 0;
			  				
			  				
			  				
			  				if( sendValue == 1 ){
			  					var tmpMessage = activityName + " 이(가) " + gcmTmpMessage + " 입니다.";
			  					memberToken = member.gcmToken;

			  					// save notification
			  					var notification = new NotificationModel({
			  						memberSeq: member.seq,
									loginEmail : member.loginEmail,
									content: tmpMessage
			  					});
			  					notification.save(function(err, doc){
			  						if(err) console.log('pushGCM notification save err', err);
			  						console.log('notification doc=', doc);
			  					});

								var message = new gcm.Message({
									collapseKey: 'Gcm Test',
									delayWhileIdle: true,
									timeToLive: 3,
									data: {
										type: 'gcmMessage',
										message: tmpMessage
									}
								});
			  					sender.send(message, memberToken, 4, function(err, result) {
									console.log('gcm message / result = ', message, result);
								});	// sender.send
			  				}
			  				cb();
						});	// MemberModel
					}
				});	// ActivityModel

		}, function(err){
				if(err) console.log('err', err);
				callback(null, statusOk);
			}); // async.each
		} // waterfall
	],
	function(err, result){
		if(err) console.log('err', err);
		result_callback(result);            
	}); //async
}	// pushGCM


exports.testSchedule = function(callback) {
	console.log('LikeActivity TestSchedule');
	callback(statusOk);
}




// ***************************** Function ***************************** //
function calDate_dDay(endDate){
  
  var today = new Date();

  var tmpEndDate = new Date(endDate);
  var days = (today - tmpEndDate) / 1000 / 60 / 60 / 24;
  var result = Math.floor(days);
  if(result > 0 ) result = "D+"+result;
  else if(result == 0 ) result = "D-Day";
  else result = "D"+result;
  
  return result;
}

function getActClass(actClass){
	var result;
	switch(actClass){
		case "전체": 		result=0; break;
		case "해외탐방": 	result=1; break;
		case "국내봉사": 	result=2; break;
		case "해외봉사": 	result=3; break;
		case "강연": 		result=4; break;
		case "멘토링": 		result=5; break;
		case "서포터즈": 	result=6; break;
		case "마케터": 		result=7; break;
		case "홍보대사": 	result=8; break;
		case "기자단": 		result=9; break;
		case "기획단": 		result=10; break;
		case "기타": 		result=11; break;		
	}
	return result;
}





exports.createLikeActivity = function(callback){

  var likeactivity = new LikeActivityModel({
    activitySeq: 9,
    member: 15,
    check: 1
  });
  likeactivity.save( function(err, doc){
    if(err) return console.error(err);
    console.log(doc);
    callback(statusOk);
  }); 

}
