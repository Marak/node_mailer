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

var SMTPClient = require("nodemailer").SMTPClient;
var EmailMessage = require("nodemailer").EmailMessage;

function SMTPClientPool() {
  this.servers = {};
}
SMTPClientPool.prototype.addClient = function(port,host,options) {
  if(this.servers[host] && this.servers[host][options.user]) return;
  var hostClients = this.servers[host] || (this.servers[host] = {});
  var pool = this;
  var client = hostClients[options.user] = new SMTPClient(host,port,options);
  client.on("close",function() {
    if(client == hostClients[options.user]) {
      //only because this could be crazy long lived and dynamic
      delete hostClients[options.user];
      if(Object.keys(hostClients).length == 0) {
	delete pool.servers[host]
      }
    }
  })
  client.on("empty",function(){
	delete hostClients[options.user];
	client.close();})
}
SMTPClientPool.prototype.send = function send(message,callback) {
  this.servers[message.SERVER.host][message.SERVER.user].sendMail(message,callback);
}

var pool = new SMTPClientPool();

exports.send = function node_mail(message,callback) {
  var server = {
    host: message.host,
    hostname: message.domain,
    port: +message.port,
    use_authentication: message.authentication,
    ssl: message.ssl,
    user: new Buffer(message.username || '', 'base64').toString('utf8'),
    pass: new Buffer(message.password || '', 'base64').toString('utf8'),
    debug: true
    }
  if(message.username || message.password) {
    pool.addClient(server.port,server.host,server);
  }
  pool.send(new EmailMessage({
    to: message.to,
    sender: message.from,
    subject: message.subject,
    
    body: message.body,
    server: server,
    debug: message.debug
  }),callback)  
};
