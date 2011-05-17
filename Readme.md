#v0.4.51
<img src = "https://github.com/Marak/node_mailer/raw/master/logo.png"/><br/>
###send emails from node.js to your smtp server, simple as cake.

### Installing npm (node package manager)

     curl http://npmjs.org/install.sh | sh

### Installing say.js

     npm install mailer

# FEATURES
 - super simple api
 - emails are blasted out asynchronously
 - uses connection pooling per SMTP server
 - super simple built in templates using Mustache.js

# REQUIRES
 - SMTP Server

# USAGE
      var email = require("../lib/node_mailer");

      for(var i = 0; i < 10; i++){
  
        email.send({
          host : "localhost",              // smtp server hostname
          port : "25",                     // smtp server port
		  ssl: true,						// for SSL support - REQUIRES NODE v0.3.x OR HIGHER
          domain : "localhost",            // domain used by client to identify itself to server
          to : "marak.squires@gmail.com",
          from : "obama@whitehouse.gov",
          subject : "node_mailer test email",
          body: "Hello! This is a test of the node_mailer.",
          authentication : "login",        // auth login is supported; anything else is no auth
          username : "dXNlcm5hbWU=",       // Base64 encoded username
          password : "cGFzc3dvcmQ="       // Base64 encoded password
        },
        function(err, result){
          if(err){ console.log(err); }
        });
      }

# USING SSL
node_mailer SSL connections (not TLS / STARTTLS, just SSL from the beginning of the connection). To use it,
add an option ssl: true. See usage above.


## Authors

Marak Squires, Elijah Insua, Fedor Indutny, Bradley Meck

