/* Copyright (c) 2009 Marak Squires - http://github.com/marak/node_mailer
 
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


var tcp = require('net'), 
    sys = require('sys'),
    colors = require('colors');

var email = {
  
  connections: [],
  
  getConnection: function (options, callback) {
    
    var key = options.host + ':' + options.port;
    
    // perform lookup to determine if connection already exists for server / port
    if(typeof email.connections[ key ] == 'undefined'){
      sys.puts('no connection found for: ' + key.yellow);
      email.createConnection(options.port, options.host, function(connection){
        var key = options.host + ':' + options.port;
        email.connections[ key ] = {};
        email.connections[ key ].connection = connection; 
        callback(connection);
      });
    }
    else{
      sys.puts('connection found for: ' + key.yellow)
      callback(email.connections[ key ]);
    }
  },
  createConnection: function (port, host, callback) {
    
    var connection = tcp.createConnection(port, host);
    connection.setEncoding('utf8');
    
    connection.addListener("connect", function () {
      callback(connection);
    });

    connection.addListener("end", function() {
      connection.end();
    });

    connection.addListener("data", function (data) {
        if(email.parseResponse(data)){
          sys.puts("SUCC");
        } else{
          sys.puts("ERR");
        }
        sys.puts(data);
    });
    
    return connection;
    
  },
  send: function (options) {

    // setup some default config options
    var options = typeof(options) == "undefined" ? {} : options;
    options.to = typeof(options.to) == "undefined" ? "marak.squires@gmail.com" : options.to;
    options.from = typeof(options.from) == "undefined" ? "obama@whitehouse.gov" : options.from;
    options.subject = typeof(options.subject) == "undefined" ? "node_mailer test email" : options.subject;
    options.body = typeof(options.body) == "undefined" ? "hello this is a test email from the node_mailer" : options.body;  
    options.host = typeof(options.host) == "undefined" ? "localhost" : options.host;
    options.domain = typeof(options.domain) == "undefined" ? "localhost" : options.domain;
    options.port = typeof(options.port) == "undefined" ? 25 : options.port;
    
    email.getConnection(options, function(connection){

      /* the  smtp payload */
      connection.write("helo " + options.domain + "\r\n");
      if(options.authentication === "login") {
        connection.write("auth login\r\n");
        connection.write(options.username + "\r\n");
        connection.write(options.password + "\r\n");
      }
      connection.write("mail from: " + options.from + "\r\n");
      connection.write("rcpt to: " + options.to + "\r\n");
      connection.write("data\r\n");
      connection.write("From: " + options.from + "\r\n");
      connection.write("To: " + options.to + "\r\n");
      connection.write("Subject: " + options.subject + "\r\n");
      connection.write("Content-Type: text/html\r\n");
      connection.write(email.wordwrap(options.body) + "\r\n");
      connection.write(".\r\n");
      connection.write("quit\r\n");
      
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
