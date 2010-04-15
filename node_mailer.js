/* Copyright (c) 2009 Marak Squires - www.maraksquires.com
 
Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:
 
The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.
 
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
*/


/********* USAGE ***********

	var email = require("./node_mailer");
	email.send({
	  to : "marak.squires@gmail.com",
	  from : "obama@whitehouse.gov",
	  subject : "node_mailer test email",
	  body : "hello this is a test email from the node_mailer"
	});
	
****************************/

var tcp = require('tcp');
var sys = require('sys');


var email = {
  send:function (options){
    var options = typeof(options) == "undefined" ? {} : options;
	options.to = typeof(options.to) == "undefined" ? "marak.squires@gmail.com" : options.to;
	options.from = typeof(options.from) == "undefined" ? "obama@whitehouse.gov" : options.from;
	options.subject = typeof(options.subject) == "undefined" ? "node_mailer test email" : options.subject;
	options.body = typeof(options.body) == "undefined" ? "hello this is a test email from the node_mailer" : options.body;	
		
	var self = this;

	this.connection = tcp.createConnection(25);
	this.connection.addListener("connect", function (socket) {
	  self.connection.write("helo localhost\r\n");
	  self.connection.write("mail from: " + options.from + "\r\n");
	  self.connection.write("rcpt to: " + options.to + "\r\n");
	  self.connection.write("data\r\n");
	  self.connection.write("From: " + options.from + "\r\n");
	  self.connection.write("To: " + options.to + "\r\n");
	  self.connection.write("Subject: " + options.subject + "\r\n");
	  self.connection.write("Content-Type: text/html\r\n");
	  self.connection.write(email.wordwrap(options.body) + "\r\n");
	  self.connection.write(".\r\n");
	  self.connection.write("quit\r\n");
	  self.connection.end();
	});

	this.connection.addListener("data", function (data) {
		if(email.parseResponse(data)){

			sys.puts("SUCC");
		}else{

			sys.puts("ERR");
		}
		sys.puts(data);
	});
  },

  parseResponse:function(data){
    var d = data.split("\r\n");
	d.forEach(function(itm){
  	  if(itm.indexOf("250 OK id=") != -1){
	    return true;
	  }
	});
    return false;
  },
  
  wordwrap:function(str){
    var m = 80;
	var b = "\r\n";
	var c = false;
	var i, j, l, s, r;
	str += '';
	if (m < 1) {
 	  return str;
	}
	for (i = -1, l = (r = str.split(/\r\n|\n|\r/)).length; ++i < l; r[i] += s) {
	  for(s = r[i], r[i] = ""; s.length > m; r[i] += s.slice(0, j) + ((s = s.slice(j)).length ? b : "")){
	    j = c == 2 || (j = s.slice(0, m + 1).match(/\S*(\s)?$/))[1] ? m : j.input.length - j[0].length || c == 1 && m || j.input.length + (j = s.slice(m).match(/^\S*/)).input.length;
	  }
	}
    return r.join("\n");
  }
}

exports.send = email.send;