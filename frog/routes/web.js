var express = require('express');
var router = express.Router();
var easyimg = require('easyimage');
var multer = require('multer');
var _storage = multer.diskStorage({
  destination: function (req, file, cb) { // 어느 디렉토리에 저장할 것인가
    // if( 파일의 형식이 이미지 )
    cb(null, './public/images/');     // /public/images에 업로드
    // else if ( 파일의 형식이 텍스트 ) cb(null, './public/texts');
  },
  filename: function (req, file, cb) {  // 디렉토리에 저장할 파일의 이름을 어떻게 할것인가

    console.log('1------------------------------------------------1');
    console.log(file);

    var originalname = file.originalname;
    var tmp = file.mimetype; // 'image/jpeg', 'image/png', 'image/gif'
    tmp = tmp.split('/')[1];
    if(tmp == 'jpeg' || tmp=='JPG') { tmp = 'jpg' };

    var ext = "." + tmp;
    var filename = originalname.substring(0, originalname.lastIndexOf('.'));
    console.log('filename=', filename);

    console.log('1------------------------------------------------1 filename function last', ext);
    console.log('1------------------------------------------------1 file.filename + ext', filename+ext);


    cb(null, filename + ext);       // 디렉토리에 filenmae+ext로 업로드
  }
});
var upload = multer({ 'storage': _storage });


/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});



// *************************************** Login *************************************** //
router.get('/signUpPage', function(req, res, next){
  var obj = { "title": "회원가입 페이지" }
  res.render('signUpPage', obj);
});


router.post('/login', function(req, res, next){
  var loginEmail = req.body.email;
  var pwd = req.body.pwd;

  if(loginEmail == 'admin' && pwd == 'admin' ){
    req.session.loginEmail = loginEmail;
    res.redirect('/web/activityList');  
  }
}); 

router.get('/logout', function(req, res, next){
  req.session.destroy(function(err){
    if(err) console.log('err', err);
    console.log('req.session.destroy');
    web_sessionCheck(req);
    res.redirect('/');
  });
});



// *************************************** Activity *************************************** //
router.get('/detailActivity/:activitySeq', function(req, res, next){
  if(!web_sessionCheck(req)) res.redirect('/');

  var seq = req.params.activitySeq;
  activity.webGetActivity(seq, function(result){ 
    res.render('web_detailActivity', result); 
    // res.json(result);
  });
});

router.get('/writeActivity', function(req, res, next){
  if(!web_sessionCheck(req)) res.redirect('/');
  res.render('web_writeActivity');
});


router.post('/insertActivity', upload.array('activityImg', 3),  function(req, res, next){
  if(!web_sessionCheck(req)) res.redirect('/');

  console.log('2------------------------------------------------2     req.body=', req.body);
  console.log('2------------------------------------------------2     req.file=', req.files[0]);
  // console.log('2------------------------------------------------2     req.file=', req.file);


  // 파일이 여러개여서 req.files[], 순서대로 0~file.length
  // 현재 req.file이 undefined인데 그 이유는, activityImg가 배열로 묶여서 file이 들어오는게 아니라 file명만 들어오고 있음.   
  var guideFile = req.files[0];
  var recruitFile = req.files[1];
  var companyLogoFile = req.files[2];

  var guidePath = path + guideFile.originalname;
  var recruitPath = path + recruitFile.originalname;
  var companyLogoPath = path + companyLogoFile.originalname;

  activity.insertActivity(req, guidePath, recruitPath, companyLogoPath, function(result){ 
    console.log('insertActivity result=', result);
    res.redirect('/web/activityList'); 
  });
});

router.get('/activityList', function(req, res, next){
  if(!web_sessionCheck(req)) res.redirect('/');

  activity.activityList(function(result){ res.render('web_activityList', result); })
});


router.get('/updateActivity/:activitySeq', function(req, res, next){
  if(!web_sessionCheck(req)) res.redirect('/');

  var seq = req.params.activitySeq;
  activity.findOneActivity(seq, function(result){ res.render('web_updateActivity', result); });
});


router.post('/updateActivity', function(req, res, next){
  if(!web_sessionCheck(req)) res.redirect('/');

  activity.webUpdateActivity(req, function(result){ res.redirect('/web/detailActivity/'+result); });
});









// ****************************** Postscript ****************************** //
router.get('/formPostscript/:activitySeq', function(req, res, next){
  if(!web_sessionCheck(req)) res.redirect('/');

  var activitySeq = req.params.activitySeq;
  activity.findOneActivity(activitySeq, function(result){ res.render('web_writeFormPostscript', result); });
});


router.post('/writePostscript', function(req, res, next){
  if(!web_sessionCheck(req)) res.redirect('/');
  // res.send('<script>alert("로그인 이메일 인증완료!");</script>')      
  postscript.insertPostscript(req, function(result){ res.redirect('/web/detailActivity/'+result); });
});


router.get('/detailPostscript/:postSeq/:activitySeq', function(req, res, next){
  if(!web_sessionCheck(req)) res.redirect('/');

  var seq = req.params.postSeq;
  var activitySeq = req.params.activitySeq;
  postscript.webDetailPostscript(seq, activitySeq, function(result){ res.render('web_detailPostscript', result); });
});


router.post('/updatePostscript', function(req, res, next){
  if(!web_sessionCheck(req)) res.redirect('/');

  postscript.updatePostscript(req, function(result){ res.redirect('/web/detailActivity/'+result); });
});


router.get('/webDeletePost/:postSeq', function(req, res, next){
  var seq = req.params.postSeq;
  postscript.webDeletePost(seq, function(result) { res.json(result); });
});










// ****************************** Interview ****************************** //
router.post('/updateInterview', function(req, res, next){
  if(!web_sessionCheck(req)) res.redirect('/');

  interview.updateInterview(req, function(result){ res.redirect('/web/detailActivity/'+result); });
});

router.get('/detailInterview/:interSeq/:activitySeq', function(req, res, next){
  if(!web_sessionCheck(req)) res.redirect('/');

  var seq = req.params.interSeq;
  var activitySeq = req.params.activitySeq;
  interview.webDetailInterview(seq, activitySeq, function(result){ res.render('web_detailInterview', result); });
});

router.get('/formInterview/:activitySeq', function(req, res, next){
  if(!web_sessionCheck(req)) res.redirect('/');

  var activitySeq = req.params.activitySeq;
  activity.findOneActivity(activitySeq, function(result){ res.render('web_writeFormInterview', result); });
});

router.post('/writeInterview', function(req, res, next){
  if(!web_sessionCheck(req)) res.redirect('/');

  interview.insertInterview(req, function(result){ res.redirect('/web/detailActivity/'+result); });
});

router.get('/delInterview/:seq', function(req, res, next){
  var seq = req.params.seq;
  interview.deleteInterview(seq, function(result){ res.json(result); });
});


function web_sessionCheck(req){  
  console.log('web_sessionCheck');
  var loginEmail = req.session.loginEmail;
  if(!loginEmail){
    console.log('1-----------------------------------------1 not function');
    return false;
  }
  else{
    console.log('1-----------------------------------------1 exist');
    return true;
  } 
}


module.exports = router;
