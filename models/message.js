
var mongoose=require('mongoose');
var Schema=mongoose.Schema;

var messageSchema=new Schema({
    ipClient:String,
	clientName:String,
    message:'String',
    timechat:'String'
});

module.exports=mongoose.model('Message',messageSchema);