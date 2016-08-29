$(document).ready(function() {	
		//connect socket.io 
		 var conn_options = {
		  'sync disconnect on unload':false
		};
		 var socket = io.connect('http://192.168.100.113:5000',conn_options);
		 
		 //send file
$('#fileUpload').on('change', function(){

  var files = $(this).get(0).files;

  if (files.length > 0){
    // One or more files selected, process the file upload

    // create a FormData object which will be sent as the data payload in the
    // AJAX request
    var formData = new FormData();

    // loop through all the selected files
    for (var i = 0; i < files.length; i++) {
      var file = files[i];

      // add the files to formData object for the data payload
      formData.append('userPhoto', file, file.name);
	  
	  //send fileupload to container chat
	  var messageDetails = {  
				ipClient : ipClient,  
				message : '<input class="click-file-download" type="submit" name="file" value="' + file.name+ '"/>'
				//message : '<form action="/download" method="POST"><input type="submit" name="file" value="' + file.name+ '"></form>'
			};
              // tell server to execute 'sendchat' and send along one parameter
              socket.emit('sendchat', messageDetails);
    }
	 $.ajax({url:'/sendImage',type:'POST',data:formData,processData: false,
      contentType: false,
           success: function(data){
          console.log('upload successful!\n' + data);
      },
			xhr: function() {
        // create an XMLHttpRequest
        var xhr = new XMLHttpRequest();

        // listen to the 'progress' event
        xhr.upload.addEventListener('progress', function(evt) {

          if (evt.lengthComputable) {
            // calculate the percentage of upload completed
            var percentComplete = evt.loaded / evt.total;
            percentComplete = parseInt(percentComplete * 100);

            // update the Bootstrap progress bar with the new percentage
            //$('.progress-bar').text(percentComplete + '%');
            $('.progress-bar').width(percentComplete + '%');

            // once the upload reaches 100%, set the progress bar text to done
            if (percentComplete === 100) {
              /* $('.progress-bar').html('Finished');
			  $('.progress-bar').animate({visibility: hidden}, 1000); */
			  
			  $(".progress-bar").animate({
					width: "100%"
				}, 5000, function() {
					$(this).closest('.progress').fadeOut();
				});
            }

          }

        }, false);

        return xhr;
      }
    });
	
	//download file upload from container chat
	$(".click-file-download").click(function(e){
	var fileDownload=this.id;
	 var formUp ='<form action="/download" method="POST">'+messageDetails.message+'</input></form>';
/* 	 $('<form action="/download" method="POST">' + 
    '<input type="hidden" name="file" value="' + fileDownload+ '">' +
    '</form>').submit(); */
		$.ajax({url:'/download',type:'POST',
			   success: function(data){
			  console.log('download successful!\n' + data);
		  }
		}); 
	}); 
  }

});  
//download file

$("#btnDownload").click(function(e){
   var fileDownload=this.id;
  $('<form action="/download" method="POST">' + 
    '<input type="hidden" name="file" value="' + fileDownload+ '">' +
    '</form>').submit();

    });  
		 	 
//Get Ip Client
// NOTE: window.RTCPeerConnection is "not a constructor" in FF22/23
var RTCPeerConnection = /*window.RTCPeerConnection ||*/ window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
var ipClient;
if (RTCPeerConnection) (function () {
    var rtc = new RTCPeerConnection({iceServers:[]});
    if (1 || window.mozRTCPeerConnection) {      // FF [and now Chrome!] needs a channel/stream to proceed
        rtc.createDataChannel('', {reliable:false});
    };
    
    rtc.onicecandidate = function (evt) {
        // convert the candidate to SDP so we can run it through our general parser
        // see https://twitter.com/lancestout/status/525796175425720320 for details
        if (evt.candidate) grepSDP("a="+evt.candidate.candidate);
    };
    rtc.createOffer(function (offerDesc) {
        grepSDP(offerDesc.sdp);
        rtc.setLocalDescription(offerDesc);
    }, function (e) { console.warn("offer failed", e); });
    
    
    var addrs = Object.create(null);
    addrs["0.0.0.0"] = false;
    function updateDisplay(newAddr) {
        if (newAddr in addrs) return;
        else addrs[newAddr] = true;
        var displayAddrs = Object.keys(addrs).filter(function (k) { return addrs[k]; });
        document.getElementById('list').textContent = displayAddrs.join(" or perhaps ").substring(0,15);
		//document.getElementById('list').textContent = displayAddrs.join("@");
		ipClient = displayAddrs.join(" or perhaps ").substring(0,15);
		//send useronline
			setInterval(function(){
				socket.emit('useronline',ipClient);
			
		},3000);
    }
    
    function grepSDP(sdp) {
        var hosts = [];
        sdp.split('\r\n').forEach(function (line) { // c.f. http://tools.ietf.org/html/rfc4566#page-39
            if (~line.indexOf("a=candidate")) {     // http://tools.ietf.org/html/rfc4566#section-5.13
                var parts = line.split(' '),        // http://tools.ietf.org/html/rfc5245#section-15.1
                    addr = parts[4],
                    type = parts[7];
                if (type === 'host') updateDisplay(addr);
            } else if (~line.indexOf("c=")) {       // http://tools.ietf.org/html/rfc4566#section-5.7
                var parts = line.split(' '),
                    addr = parts[2];
                updateDisplay(addr);
            }
        });
    }
})(); else {
    document.getElementById('list').innerHTML = "<code>ifconfig | grep inet | grep -v inet6 | cut -d\" \" -f2 | tail -n1</code>";
    document.getElementById('list').nextSibling.textContent = "In Chrome and Firefox your IP should display automatically, by the power of WebRTCskull.";
}

		//show pop up notification
		function notifyMe(user,message) {
		  // Let's check if the browser supports notifications
		  if (!("Notification" in window)) {
			alert("This browser does not support desktop notification");
		  }

		  // Let's check whether notification permissions have already been granted
		  else if (Notification.permission === "granted") {
			// If it's okay let's create a notification
			<!-- var options = { body: randomQuote, icon: 'img/sad_head.png', } -->
			var n = new Notification(user.username, {body: message, icon: "img.jpg" }); 
			
			//click focus window chat and close notification popup
			n.onclick = function(){ window.focus(); this.close(); };
			
			//set time out close popup notification
			setTimeout(n.close.bind(n), 5000); 
			
		  }

		  // Otherwise, we need to ask the user for permission
		  else if (Notification.permission !== 'denied') {
			Notification.requestPermission(function (permission) {
			  // If the user accepts, let's create a notification
			  if (permission === "granted") { 
				var n = new Notification(user.username, {body: message, icon: "img.jpg" }); 
				setTimeout(n.close.bind(n), 5000);
			  }
			});
		  }
		  // At last, if the user has denied notifications, and you 
		  // want to be respectful there is no need to bother them any more.
		}
		
		//update hint in tab browser
		//count how many message unread
		var iconNew = './emotion/images/emoji/favicon-dot.ico';

		var count = 0;
		var title = document.title;
		var update;
		function changeTitle() {
			if(count > 0) {
				var newTitle = '(' + count + ') ' + title;
				document.title = newTitle;
				document.getElementById('favicon').href = iconNew;
			}
		}

		function newUpdate() {
			count = 0;
			update = setInterval(changeTitle, 10);
			//updateFavicon = setInterval(changeFavicon, 1000);
		}
		
		//clear notification when user active
		$(window).blur(newUpdate);

		$(window).focus(function() {
			$('#msg').focus();
			clearInterval(update);
			setInterval(function() {
				document.title = title;
				document.getElementById('favicon').href = "";
			},2000);
			
			//display highlight when have message unread.
			for(var i=1;i<=count;i++){
			
				$("div.skype-parent > div.message:nth-last-child("+i+") >div").animate({color:'#faa523'}, 500, 
				function(){ $(this).animate({ 'color' : '#AFCBD8' },500)})

				$("div.skype-parent > div.message:nth-last-child("+i+") >div>p").animate({backgroundColor:'#ffcc00'}, 500, 
				function(){ $(this).animate({ 'backgroundColor' : '#c7edfc'},500)})
				
				$("div.skype-parent > div.message:nth-last-child("+i+") >div>p").animate({color:'#faa523'}, 500, 
				function(){ $(this).animate({ 'color' : '#6E767C' },500)})
			}
			count = 0;
		});
		
		//format message
		function escaped(s) {
          return $("<div></div>").text(s).html();
        }
		//get day in week
		function dayinWeek(num){
			var weekday=new Array(7);
			weekday[0]="Sunday";
			weekday[1]="Monday";
			weekday[2]="Tuesday";
			weekday[3]="Wednesday";
			weekday[4]="Thursday";
			weekday[5]="Friday";
			weekday[6]="Saturday";
		return weekday[num];
		}
		//display time chat
		function viewTimechat(datechat) {
			var viewday = "";
			var today = new Date();
			var dif = today.getTime() - datechat.getTime();
			var seconds_from_today_to_datechat = dif / 1000;
			var seconds_Between_Dates = Math.abs(seconds_from_today_to_datechat);
			//console.log(today.getDay());
			//console.log(datechat.getDay());
			//if()
			if(seconds_Between_Dates > 82712 * 7) {
				viewday = datechat.getDate() +'/'+ (datechat.getMonth()+1);
			} else if(seconds_Between_Dates > 82712/2) {
				viewday = dayinWeek(datechat.getDay());
			} else {
			    if(datechat.getMinutes() < 10) {
					minute = '0' + datechat.getMinutes();
				}else{
					minute = datechat.getMinutes();
				}
				viewday = datechat.getHours() +':'+ minute;
			}
			return viewday;
		}
		//generate msg
		function generate(msg,showname = true){
		var msgOfuser = msg.ipClient == ipClient ? true : false;
		var datechat = new Date(+msg.timechat);
		var haveLink = msg.message.indexOf("http") !== -1 ||  msg.message.indexOf("https") !== -1;
		var havevideoFacebook = msg.message.indexOf("https://www.facebook.com/") !== -1 && msg.message.indexOf("/videos/") !== -1;
		var haveImage = msg.message.indexOf(".jpg") !== -1 || msg.message.indexOf(".png") !== -1 || msg.message.indexOf(".gif") !== -1 || msg.message.indexOf(".tiff") !== -1;
		var filedownload = msg.message.indexOf("click-file-download") !== -1;
				var strVar="";
				if(showname){
					if(msgOfuser) {
						strVar += "<div class=\"message user\">";
					} else{
						strVar += "<div class=\"message\">";
					}
					strVar += "    <div><\/div>";
					if(havevideoFacebook){
						var urlcodeFace = msg.message.split("videos/").pop();
						strVar += "    <div><p><iframe width='500' height='280' src='https://www.facebook.com/video/embed?video_id="+urlcodeFace+"frameborder='0' allowfullscreen></iframe><\/p><\/div>";
					} else if(haveLink){
						if(typeof msg.title != "undefined" && typeof msg.description != "undefined" && typeof msg.img != "undefined" ) {
							strVar += "    <div><p>"+addLink(msg.message,msg.title)+"</br><img src='"+msg.img+"' width='200px' height='200px'/></br>"+msg.description+"<\/p><\/div>";
						}else if(typeof msg.title != "undefined" && typeof msg.description != "undefined" && typeof msg.img == "undefined" ) {
							strVar += "    <div><p>"+addLink(msg.message,msg.title)+"</br>"+msg.description+"<\/p><\/div>";
						}else if(typeof msg.title != "undefined"  && typeof msg.img != "undefined" && typeof msg.description == "undefined")  {
							strVar += "    <div><p>"+addLink(msg.message,msg.title)+"</br><img src='"+msg.img+"' width='200px' height='200px'/><\/p><\/div>";
						} else{
							if(haveImage){
								strVar += "    <div><p<a class='linkClick' onclick='window.open(\""+msg.message+"\");return false;' href='#'><img src="+msg.message+" width='300px' height='300px' /></a><\/p><\/div>";
							} else{
								strVar += "    <div><p>"+addLink(msg.message,msg.title)+"<\/p><\/div>";							}
						}
					} else if(filedownload){
							strVar += "    <div><form action='/download' method='POST'><p>"+msg.message+"<\/p><\/form><\/div>";
					} else{
							strVar += "    <div><p>"+msg.message+"<\/p><\/div>";
						}
					strVar += "    <div>"+viewTimechat(datechat)+"<\/div>";
					strVar += "  <\/div>";
				} else {
					if(msgOfuser) {
						strVar += "<div class=\"message user\">";
					} else {
						strVar += "<div class=\"message\">";
					}
					strVar += "    <div>"+msg.clientName+"<\/div>";
					if(haveLink){
						if(typeof msg.title != "undefined" && typeof msg.description != "undefined" && typeof msg.img != "undefined" ) {
							strVar += "    <div><p>"+addLink(msg.message,msg.title)+"</br><img src='"+msg.img+"' width='200px' height='200px'/></br>"+msg.description+"<\/p><\/div>";
						}else if(typeof msg.title != "undefined" && typeof msg.description != "undefined" && typeof msg.img == "undefined" ) {
							strVar += "    <div><p>"+addLink(msg.message,msg.title)+"</br>"+msg.description+"<\/p><\/div>";
						}else if(typeof msg.title != "undefined"  && typeof msg.img != "undefined" && typeof msg.description == "undefined")  {
							strVar += "    <div><p>"+addLink(msg.message,msg.title)+"</br><img src='"+msg.img+"' width='200px' height='200px'/><\/p><\/div>";
						} else{
							strVar += "    <div><p>"+addLink(msg.message,msg.title)+"<\/p><\/div>";
						}
					}else{
							strVar += "    <div><p>"+msg.message+"<\/p><\/div>";
						}
					strVar += "    <div>"+viewTimechat(datechat)+"<\/div>";
					strVar += "  <\/div>";
				}
					return strVar;
			 }
			 
		 socket.on('listuser_online', function (clients) {
				$('#listuser').html('');
			for(var i=0;i<clients.length;i++){
				$('#listuser').append('<li class="username-online">'+clients[i]+'</li></br>');
			}
			sendIp = true;
			//clearInterval(sendIpUserOnline);
		 });
		 
		//show all chat
		socket.on('showallchat', function (messages) {
			str_message = "";
			if (messages.length) {
				str_message += generate(messages[0],false);
			}
			for (var i= 1;i< messages.length;i++) {
				if(messages[i].clientName != messages[i-1].clientName) {
					str_message += generate(messages[i],false);
				} else {
					str_message += generate(messages[i],true);
				}
			}
			$('.skype-parent').html(str_message);
			emojify.run();
		});
		//show more chat 
		socket.on('showMore', function (ipViewMore,messages) {
			if(ipViewMore == ipClient) {
				str_message = "";
				if (messages.length) {
					str_message += generate(messages[0],false);
				}
				for (var i= 1;i< messages.length;i++) {
					if(messages[i].clientName != messages[i-1].clientName) {
						str_message += generate(messages[i],false);
					} else {
						str_message += generate(messages[i],true);
					}
				}
				$('.skype-parent').html(str_message);
				emojify.run();
			}
		});
		
		//add link for message contain link
		function addLink(msgLink,title){
			var firstMsg = msgLink.substring(0,msgLink.indexOf('http'));
			var mlink =  msgLink.substring(msgLink.indexOf("http"));
			if(mlink.indexOf(' ')!== -1){
				var endMsg = mlink.substring(mlink.indexOf(' '));
				mlink = mlink.substring(0,mlink.indexOf(' '));
			} 
			if(typeof title != "undefined"){
				if(typeof firstMsg != "undefined" && typeof endMsg != "undefined") {
					return firstMsg+" <a class='linkClick' onclick='window.open(\""+mlink+"\");return false;' href='#'>"+title+"</a> " +endMsg;
				} else if(typeof firstMsg !== "undefined" && typeof endMsg === "undefined"){
					return firstMsg+" <a class='linkClick' onclick='window.open(\""+mlink+"\");return false;' href='#'>"+title+"</a>";
				} else if(typeof firstMsg === "undefined" && typeof endMsg !== "undefined"){
					return "<a class='linkClick' onclick='window.open(\""+mlink+"\");return false;' href='#'>"+title+"</a> "+endMsg;
				} else {
					return "<a class='linkClick' onclick='window.open(\""+mlink+"\");return false;' href='#'>"+title+"</a>";
				}
				
			} else if(typeof title == "undefined"  ){
				if(typeof firstMsg !== "undefined" && typeof endMsg !== "undefined") {
					return firstMsg+" <a class='linkClick' onclick='window.open(\""+mlink+"\");return false;' href='#'>"+mlink+"</a> " +endMsg;
				} else if(typeof firstMsg !== "undefined" && typeof endMsg === "undefined"){
					return firstMsg+" <a class='linkClick' onclick='window.open(\""+mlink+"\");return false;' href='#'>"+mlink+"</a>";
				} else if(typeof firstMsg === "undefined" && typeof endMsg !== "undefined"){
					return "<a class='linkClick' onclick='window.open(\""+mlink+"\");return false;' href='#'>"+mlink+"</a> "+endMsg;
				} else {
					return "<a class='linkClick' onclick='window.open(\""+mlink+"\");return false;' href='#'>"+mlink+"</a>";
				}
			} else{
				return msgLink;
			}
		}
		//generate msg when anybody update chat
		function generateUpdatechat(user,msg,showname = true){
		var msgOfuser = user.ipClient == ipClient ? true : false;
		var datechat = new Date(+user.timechat);
		var haveLink = msg.indexOf("http") !== -1 ||  msg.indexOf("https") !== -1;
		var havevideoFacebook = msg.indexOf("https://www.facebook.com/") !== -1 && msg.indexOf("/videos/") !== -1;
		var haveImage = msg.indexOf(".jpg") !== -1 || msg.indexOf(".png") !== -1 || msg.indexOf(".gif") !== -1 || msg.indexOf(".tiff") !== -1;
		var filedownload = msg.indexOf("click-file-download") !== -1;
				var strVar="";
				if(showname){
					if(msgOfuser) {strVar += "<div class=\"message user\">";}else{strVar += "<div class=\"message\">";}
					strVar += "    <div><\/div>";
					if(havevideoFacebook){
						var urlcodeFace = msg.split("videos/").pop();
						strVar += "    <div><p><iframe width='500' height='280' src='https://www.facebook.com/video/embed?video_id="+urlcodeFace+"frameborder='0' allowfullscreen></iframe><\/p><\/div>";
					} else if(haveLink){
						if(typeof user.title != "undefined" && typeof user.description != "undefined" && typeof user.img != "undefined" ) {
							strVar += "    <div><p>"+addLink(msg,user.title)+"</br><img src='"+user.img+"' width='200px' height='200px'/></br>"+user.description+"<\/p><\/div>";
							//alert("1"+strVar);
						}else if(typeof user.title != "undefined" && typeof user.description != "undefined" && typeof user.img == "undefined" ) {
							strVar += "    <div><p>"+addLink(msg,user.title)+"</br>"+user.description+"<\/p><\/div>";
							//alert("2"+strVar);
						}else if(typeof user.title != "undefined"  && typeof user.img != "undefined" && typeof user.description == "undefined")  {
							strVar += "    <div><p>"+addLink(msg,user.title)+"</br><img src='"+user.img+"' width='200px' height='200px'/><\/p><\/div>";
							//alert("3"+strVar);
						} else{
							
							if(haveImage){
								strVar += "    <div><p><a class='linkClick' onclick='window.open(\""+msg+"\");return false;' href='#'><img src="+msg+" width='300px' height='200px' /></a><\/p><\/div>";
							} else{
								strVar += "    <div><p>"+addLink(msg,user.title)+"<\/p><\/div>";
							}
							//alert("4"+strVar);
						}
					} else if(filedownload){
							strVar += "    <div><form action='/download' method='POST'><p>"+msg+"<\/p><\/form><\/div>";
					} else{
							strVar += "    <div><p>"+msg+"<\/p><\/div>";
					}
					strVar += "    <div>"+viewTimechat(datechat)+"<\/div>";
					strVar += "  <\/div>";
				} else {
					if(msgOfuser) {strVar += "<div class=\"message user\">";}else{strVar += "<div class=\"message\">";}
					strVar += "    <div>"+user.username+"<\/div>";
					if(haveLink){
						if(typeof user.title != "undefined" && typeof user.description != "undefined" && typeof user.img != "undefined" ) {
							strVar += "    <div><p>"+addLink(msg,user.title)+"</br><img src='"+user.img+"' width='200px' height='200px'/></br>"+user.description+"<\/p><\/div>";
						}else if(typeof user.title != "undefined" && typeof user.description != "undefined" && typeof user.img == "undefined" ) {
							strVar += "    <div><p>"+addLink(msg,user.title)+"</br>"+user.description+"<\/p><\/div>";
						}else if(typeof user.title != "undefined"  && typeof user.img != "undefined" && typeof user.description == "undefined")  {
							strVar += "    <div><p>"+addLink(msg,user.title)+"</br><img src='"+user.img+"' width='200px' height='200px'/><\/p><\/div>";
						} else{
							strVar += "    <div><p>"+addLink(msg,user.title)+"<\/p><\/div>";
						}
					} else{
						strVar += "    <div><p>"+msg+"<\/p><\/div>";
					}
					strVar += "    <div>"+viewTimechat(datechat)+"<\/div>";
					strVar += "  <\/div>";
				}
					return strVar;
			 }
		//new message
		var userNotification;
		socket.on('updatechat', function (user, data) {
				count ++;
				str_msg = "";
				//send all exception user 
				if(ipClient != user.ipClient){
					notifyMe(user,data);
				}
				//check last client send msg
				console.log(user.same);
				if(user.same) {
					//str_msg+='</b> ' + escaped(data) + "<br/>" + escaped(user.timechat) + "<br/>";
					str_msg += generateUpdatechat(user,data,true);
				} else {
					//str_msg+='<b>' + escaped(user.username) + ':</b> '+ escaped(data) + "<br/>" + escaped(user.timechat) + "<br/>";
					str_msg += generateUpdatechat(user,data,false);
				}
				$('.skype-parent').append(str_msg);
				
				console.log(str_msg);
				
				
				userNotification = user.username;
				
				//constant emojify
				emojify.setConfig({
					emojify_tag_type : 'div',           // Only run emojify.js on this element
					only_crawl_id    : null,            // Use to restrict where emojify.js applies
					img_dir          : './emotion/images/emoji',  // Directory for emoji images
					ignored_tags     : {                // Ignore the following tags
						'SCRIPT'  : 1,
						'TEXTAREA': 1,
						'A'       : 1,
						'PRE'     : 1,
						'CODE'    : 1
					}
				});
				
				//run emojify
				emojify.run();
				//scroll bottom when add more text
				var objDiv = $('.container_chat');
				if (objDiv.length > 0){
					//objDiv[0].scrollTop = objDiv[0].scrollHeight;
					win.animate({ scrollTop: objDiv[0].scrollHeight}, 1000);
				}
				console.log(user.ipClient);
				console.log(ipClient);
		});

		//add div update display anybody Typing
		function isInArray(value, array) {
		  return array.indexOf(value) > -1;
		}
		socket.on('updateStatusTyping', function (data,iptyping) {
			console.log(iptyping);
			if(!isInArray(ipClient,iptyping)){
				if(iptyping.length > 2){
					$('#statusTyping').html(data[0]+','+data[1]+'and'+(iptyping.length-2)+' is typing...');
				} else if(iptyping.length == 2){
					$('#statusTyping').html(data[0]+','+data[1]+' is typing...');
				} else if(iptyping.length == 1){
					$('#statusTyping').html(data[0]+' is typing...');
				}
			} 
		});
		socket.on('updateStatuslongTyping', function (data) {
				$('#statusTyping').html(data);
		
		});
		

			////////////////////Trailing///////////////////////////////////////////////
			$('#msg').val('');
			var win = $('.container_chat');
			//win.scrollTop = win[0].scrollHeight;
			win.animate({ scrollTop: 7700}, 1000);
			
			
            
			//join room
			 socket.on('message_room', function (data) {
			  console.log(data);
			  $('#messages_room').append(data);
			 });
			
			//icon chat
			
			//$('#msg').emojiarea({wysiwyg: false});
			
			var $wysiwyg = $('#msg').emojiarea({wysiwyg: false});
			var $wysiwyg_value = $('#msg-value');
			
			$wysiwyg.on('change', function() {
				$wysiwyg_value.text($(this).val());
			});
			$wysiwyg.trigger('change');

			
			$('#room').click(function() {
			 socket.emit('subscribe_room', 'roomOne');
			 $('#messages').text('');
			 });
			$('#roomAll').click(function() {
			 socket.emit('unsubscribe_room', 'roomOne');
			 $('#messages').text('');
			});

			 $('#btnsend_room').click(function() {
			  var room = $('#room').text(),
			   message = $('#msg_room').val();
				console.log(room);
				console.log(message);
			  socket.emit('sendmsg_room', { room: room, message: message });
			 });
			 //end join room
			 ////////////////////EndTrailing//////////////////////////////////////////////
			 //Load more message when scroll up
			 
			 var win = $('.container_chat');
			var stepsize = 50;
			// Each time the user scrolls
			/* var lastScrollTop = 0;
			win.on('scroll', function() {
				var scrollTop = $(this).scrollTop();
				
				console.log(stepsize);
					if (scrollTop <= lastScrollTop && scrollTop <=0 ) {
						stepsize = stepsize + 50;
						//win.animate({ scrollTop: 300}, 500);
						console.log('viewmore:'+ipClient);
						socket.emit('viewmore',ipClient,parseInt(stepsize));
					}
					lastScrollTop = scrollTop;
			}); */
			
			
			win.bind('mousewheel', function(e){
				if(e.originalEvent.wheelDelta /120 > 0) {
					var scrollTop = $(this).scrollTop();
					if (scrollTop ==0 ) {
						stepsize = stepsize + 50;
						win.animate({ scrollTop: 200}, 500);
						console.log('viewmore:'+ipClient);
						socket.emit('viewmore',ipClient,parseInt(stepsize));
					}
				}
			});
			 
			 
			 //check active btnsend
			$('#msg').keyup(function() {
				var message = $('#msg').val();
				var buttonSend = document.getElementById("btnsend");
			  if(message.trim()!="" && message.length >0){
			   imageUrl = './emotion/images/emoji/btnsend_active.png';
				$('#btnsend').css('background-image','url(' + imageUrl + ')');
				buttonSend.disabled = false;
			  } else {
				imageUrl = './emotion/images/emoji/btnsend_unactive.png';
				$('#btnsend').css('background-image','url(' + imageUrl + ')');
				buttonSend.disabled = true;
			  }
				
			});
			
			//check typing
			var typing = false;
			var timeout = undefined;

			function timeoutFunction(){
			  typing = false;
			  socket.emit('longTyping',"");
			}

			function onKeyDownNotEnter(){
			  if(typing == false) {
				typing = true;
				socket.emit('isTyping',ipClient);
				timeout = setTimeout(timeoutFunction, 1500);
			  } else {
				clearTimeout(timeout);
				timeout = setTimeout(timeoutFunction, 1500);
			  }

			}
			
          // when the client hits ENTER on their keyboard
          $('#msg').keypress(function(e) {
			var message = $('#msg').val().trim();
			if(message!="" && message.length >0){
				if(e.which == 13) {
				  $('#msg').val('');
				  var messageDetails = {  
					ipClient : ipClient,  
					message : $("<div>").text(message).html()
					};
					
				  socket.emit('sendchat', messageDetails);
				} else{
					onKeyDownNotEnter();
				}

			}
          });
		  
		  
		  // when the client hits ENTER on their keyboard
          $('#btnsend').click(function(e) {
              var message = $('#msg').val().trim();
              $('#msg').val('');
			  
			  var messageDetails = {  
				ipClient : ipClient,  
				message : $("<div>").text(message).html()
			};
              // tell server to execute 'sendchat' and send along one parameter
              socket.emit('sendchat', messageDetails);
			 
          });
		  
		  //when click expand list user online
			$('#expand_user').click(function(e) {
			 $("#listuser").toggle();
			 $('#expand_user').toggleClass('glyphicon-collapse-up glyphicon-collapse-down');
          });
		  
		  //when click expand list user online
			$('.linkClick').click(function(e) {
			 
          });
		  
        });