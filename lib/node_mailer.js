/* Copyright (c) 2009-2010 Marak Squires, Elijah Insua, Fedor Indutny - http://github.com/marak/node_mailer
 
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


var Buffer = require('buffer').Buffer,
    tcp            = require('net'), 
    fs             = require('fs'),
    carrier        = require('carrier'),
    colors         = require('colors'),
    mustache       = require('../vendor/mustache'),
    defaultOptions = {
      to      : "marak.squires@gmail.com",
      from    : "obama@whitehouse.gov",
      data    : {},
      subject : "node_mailer test email",
      body    : "hello this is a test email from the node_mailer",
      host    : "localhost",
      domain  : "localhost",
      'content-type': 'text/plain',
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
          self.connect(function(err) {
            if (err) {
              console.log(err.red.bold);
              return;
            }
            doProcess();
          });
          return;
        } else doProcess();

        function doProcess() {        
          var email = self._queue.shift();

          if (!email)  return;
          var from = email.options.from,
              msg;
          
          function _cb_tpl(fn) {
            return function(err) {
              if (err) {
                try {
                  self.disconnect();
                } catch(e) {
                }
                return;
              }
              fn();
            };
          }
          
          writeFrom();
          
          function writeFrom() {
            self._stream.write(
              'mail from: ' + (/<.+>/.test(from) ? from : '<' + from + '>') +
              '\r\n'
            );
            
            self._stream.promise.wait('accepted', _cb_tpl(writeTo));
          }

          function writeTo() {
            function extractEmail(fullEmail) {
              var m = fullEmail.match(/<([^>]+)>/);
              return m? m[1]: fullEmail;
            }

            // thx @viktar         
            self._stream.write('rcpt to: ' + extractEmail(email.options.to) +
                               '\r\n');
            self._stream.promise.wait('accepted', _cb_tpl(writeDataStart));
          }
          
          function writeDataStart() {
            self._stream.write('data\r\n');
            self._stream.promise.wait('continue', _cb_tpl(writeData));          
          }          
          
          function writeData() {
            self._stream.write([
              'From: ' + email.options.from,
              'To: ' + email.options.to,
              'Subject: ' + email.options.subject,
              'Content-Type: ' + email.options['content-type'],
              'Content-Transfer-Encoding: base64',
              '',
              new Buffer(email.options.body).toString('base64'),
              '.',
              'RSET',
              ''
            ].join('\r\n'));
            
            onEnd();
          }
          
          function onEnd() {
            if (self._queue.length > 0) {
              process.nextTick(dequeue);
            } else {              
              self.disconnect();
            }
          }
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
          stream = tcp.createConnection(this.options.port, this.options.host),
          stream_promise = new process.EventEmitter;
      
      stream.promise = stream_promise;
      
      // Parse reply lines
      carrier.carry(stream, this.options.debug ? function(line) {
        self.options.debug('>> ' + line);
        onLine(line);
      } : onLine);
      function onLine(line) {
        // If we got successfull auth
        if (/^235\s/.test(line)) {
          stream_promise.emit('auth');
        } else       
        // If server has accepted something
        if (/^250\s/.test(line)) {
          stream_promise.emit('accepted');
        } else
        // If server says Continue
        if (/^354\s/.test(line)) {
          stream_promise.emit('continue');
        }
      }
      
      if (self.options.debug) {
        (function(write) {
          stream.write = function(data) {
            self.options.debug('<< ' + data.toString());
            write.apply(this, arguments);
          };
        })(stream.write);
      }
      
      // Wait for event with timeout
      stream_promise.wait = function(event, callback, timeout) {
        self.options.debug && self.options.debug('Waiting for: ' + event);
        
        stream_promise.on(event, onEvent);
        
        function onEvent() {
          stream_promise.removeListener(event, onEvent);
          clearTimeout(timeout);
          callback(null);
        }
        
        var timeout = setTimeout(function() {
          stream_promise.removeListener(event, onEvent);
          callback('timeout');
        }, timeout || 5000);
      };
      
      stream.setEncoding("utf8");
      stream.on("connect", function() {
        self._stream = stream;
        self._connecting = false;
        
        stream.write("helo " + self.options.domain + "\r\n");
        stream.promise.wait('accepted', function() {
          if(self.options.authentication === "login") {
            stream.write("auth login\r\n");
            stream.write(self.options.username + "\r\n");
            stream.write(self.options.password + "\r\n");
            
            if (typeof fn === 'function') {
              // Set auth callback
              stream_promise.wait('auth', function(err) {
                if (err) {
                  try {
                    self.disconnect();
                  } catch (e) {
                  }
                }
                fn(err, self._stream);              
              }, self.options.auth_timeout);
            }
          } else {
            if (typeof fn === 'function') {
              fn(null, self._stream);
            }
          }
        });
      });

      stream.on("error", function() {
        self.callback(new Error("could not connect"));
        console.log(arguments);
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
      self.connect(function(err) {
        if (err) {
          // Probably process error
          console.log(err.red.bold);
          return;
        }
        process.nextTick(function() {
          self._process()
        });
      });
    });
  },
  disconnect : function() {
    this._processing = false;
    if (this._stream) {
      this._stream.end('quit\r\n');
      this._stream = null;
    }
  }
};

var Email = function(options, callback) {
  this.options = options;
  
  if (options.lineWrap === undefined && /html/i.test(options['content-type'])) {
    options.lineWrap = false;
  }
  
  if (options.lineWrap !== false) {
    this.options.body = this.lineWrap(this.options.body);
  }

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
    // Split by lines
    return str.split(/\r|\n|\r\n/g).reduce(function(prev, piece) {
      
      var parts = [];
      
      // Wrap line
      while (piece.length) {
        var match = piece.match(/^.{1,80}(?:\s|$)/),
            matchlen;
        
        if (!match) {
          match = [piece.substr(0, 80)];
        }
        
        if (matchlen = match[0].length) {
          parts.push(match[0]);
          piece = piece.substr(matchlen);
        }
      };
      
      return prev.concat(parts);
      
    }, []).join('\r\n');
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

