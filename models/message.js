
var mongoose=require('mongoose');
var Schema=mongoose.Schema;

var messageSchema=new Schema({
    ipclient:String,
    message:'String',
    timechat:'String'
});

module.exports=mongoose.model('Message',messageSchema);