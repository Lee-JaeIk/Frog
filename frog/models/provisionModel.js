// provisionModel.js
var mongoose = require('mongoose'),
Schema = mongoose.Schema,
autoIncrement = require('mongoose-auto-increment');

var connection = mongoose.createConnection("mongodb://localhost/testFrog");
autoIncrement.initialize(connection);

var ProvisionSchema = new mongoose.Schema({
	seq : Number,
	loginEmail : { type:String, default:"loginEmail@loginmail.com"},
	num : { type:Number, default: 0},
	pwd : { type:String, default:"password"},
	checkProvision : { type:Number, default:0 }
});

ProvisionSchema.plugin(autoIncrement.plugin, {model: 'Provision', field: 'seq'});
mongoose.model('Provision', ProvisionSchema);