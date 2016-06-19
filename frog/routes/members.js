var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});








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


router.get('/createMember', function(req, res, next){
  member.createMember(function(result){ res.json(result); });
});

router.get('/getMember/:seq', function(req, res, next){
  seq = req.params.seq;
  member.getMember(seq, function(result){ res.json(result); });
});


module.exports = router;
