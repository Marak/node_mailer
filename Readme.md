#v0.3.0
<img src = "http://imgur.com/5Ol90.png"/><br/>
###send emails from node.js to your smtp server, simple as cake.

### Installing npm (node package manager)

     curl http://npmjs.org/install.sh | sh

### Installing say.js

     npm install mailer

# FEATURES
 - super simple api
 - emails are blasted out asynchronously
 - uses connection pooling per SMTP server

# REQUIRES
 - SMTP Server


# USAGE
      var email = require("mailer");

      for(var i = 0; i < 10; i++){

        email.send({
          host : "localhost",              // smtp server hostname
          port : "25",                     // smtp server port
          domain : "localhost",            // domain used by client to identify itself to server
          to : "marak.squires@gmail.com",
          from : "obama@whitehouse.gov",
          subject : "node_mailer test email",
          body : "hello this the " + i + " a test email from the node_mailer",

          authentication : "login",        // auth login is supported; anything else is no auth
          username : "dXNlcm5hbWU=",       // Base64 encoded username
          password : "cGFzc3dvcmQ=",       // Base64 encoded password

        });

      }

## Authors

Marak Squires, Elijah Insua 