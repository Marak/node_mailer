/* Copyright (c) 2009-2010 Marak Squires, Elijah Insua - http://github.com/marak/node_mailer
 
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


var tcp            = require('net'), 
    fs             = require('fs'),
    mustache       = require('../vendor/mustache'),
    defaultOptions = {
      to      : "marak.squires@gmail.com",
      from    : "obama@whitehouse.gov",
      data    : {},
      subject : "node_mailer test email",
      body    : "hello this is a test email from the node_mailer",
      host    : "localhost",
      domain  : "localhost",
      port    : 25
    },
    keys           = Object.keys(defaultOptions),
    connections    = {},
    templateCache  = {};

exports.connections = connections;

var Connection = function(options, callback) {
  this.options = options;
  this.callback = callback || function(){};
};
Connection.prototype = {
  options     : {},
  _stream     : null,
  _connecting : false,
  _queue      : [],
  _processing : false,
  _process    : function() {
    var self = this;
    if (!self._stream ||
        ['open', 'writeOnly'].indexOf(self._stream.readyState) === -1)
    {
      return;
    }

    if (!self._processing) {
      var dequeue = function() {
        if (!self._stream ||
            ['open', 'writeOnly'].indexOf(self._stream.readyState) === -1)
        {
          self.connect(function() {
            self._process;
          });
          return;
        }

        var email = self._queue.shift();

        if (email) {
          // TODO: incremental sending.. (think drain + pause/resume)
          self._stream.write("mail from: " + email.options.from + "\r\n");
          self._stream.write("rcpt to: " + email.options.to + "\r\n");
          self._stream.write("data\r\n");
          self._stream.write("From: " + email.options.from + "\r\n");
          self._stream.write("To: " + email.options.to + "\r\n");
          self._stream.write("Subject: " + email.options.subject + "\r\n");
          self._stream.write("Content-Type: text/html\r\n");
          self._stream.write(email.options.body + "\r\n");
          self._stream.write(".\r\n");
          self._stream.write("RSET\r\n");
        }

        if (self._queue.length > 0) {
          process.nextTick(dequeue);
        } else {
           self._processing = false;
          self.disconnect();
        }
      };

      self._processing = true;
      process.nextTick(dequeue);
    }
  },
  connect : function(fn) {
    if (!this._stream && !this._connecting) {
      this._connecting = true;
      
      var self   = this,
          stream = tcp.createConnection(this.options.port, this.options.host);

      stream.setEncoding("utf8");
      stream.on("connect", function() {
        self._stream = stream;
        self._connecting = false;
        
        stream.write("helo " + self.options.domain + "\r\n");
        if(self.options.authentication === "login") {
          stream.write("auth login\r\n");
          stream.write(self.options.username + "\r\n");
          stream.write(self.options.password + "\r\n");
        }

        if (typeof fn === 'function') {
          fn(self._stream);
        }
      });

      stream.on("error", function() {
        self.callback(new Error("could not connect"));
        stream.destroy();
        self._connecting = false;
        stream = null;
      });

      stream.on("end", function() {
        self.callback(null);
        self._connecting = false;
        self._stream = null;
      });
    } else if (typeof fn === 'function') {
      process.nextTick(function() {
        fn(this._stream);
      });
    }
  },
  queue : function(email) {
    var self = this;
    self._queue.push(email);
    process.nextTick(function() {
      self.connect(function() {
        process.nextTick(function() {
          self._process()
        });
      });
    });
  },
  disconnect : function() {
    if (this._stream) {
      this._stream.end('quit\r\n');
      this._stream = null;
    }
  }
};

var Email = function(options, callback) {
  this.options = options;

  this.options.body = this.lineWrap(this.options.body);

  // create a new connection if needed
  var connectionKey = [options.host, options.port].join(':');
  if (!connections[connectionKey]) {
    connections[connectionKey] = new Connection(options, callback);
  }

  // queue this email in the appropriate connection
  connections[connectionKey].queue(this);
};

Email.prototype = {
  options  : {},
  lineWrap : function(str) {
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
        j = c == 2 || (j = s.slice(0, m + 1).match(/\S*(\s)?$/))[1] ? m : j.input.length - j[0].length || c == 1 && m || j.input.length + (j = s.slice(m).match(/^\S* TODO /)).input.length;
      }
    }
    return r.join("\n");
  }
};

exports.send = function(options, callback) {
  var i, key;
  options = options || {};

  // fill in the gaps with defaultOptions
  for (i=0; i<keys.length; i++) {
    key = keys[i];
    if (typeof options[key] === "undefined") {
      options[key] = defaultOptions[key];
    }
  }
  var eyes = require('eyes');
  
  // determine if we need to load a template before processing email for sending
  
  // there is currently a bit of a dog pile effect on the template caching, but in theory
  // it should eventually cache before we run out of File Descriptors. templateCache should be refactored 
  if(options.template){
    if(typeof templateCache[options.template] != 'undefined'){
      options.body = mustache.to_html(templateCache[options.template], options.data);
      return new Email(options, callback);
    }
    else{
      fs.readFile(options.template, function (err, data) {
        if (err) throw err;
        templateCache[options.template] = data.toString();
        options.body = mustache.to_html(templateCache[options.template], options.data);
        return new Email(options, callback);
      });
    }
  }
  else{
    return new Email(options, callback);
  }

};
