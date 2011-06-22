#v0.6.4
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
          username : "my_username",        // username
          password : "my_password"         // password
        },
        function(err, result){
          if(err){ console.log(err); }
        });
      }

# USING SSL
This fork supports SSL connections. To use it,
add an option ssl: true. See usage above.


# USING TEMPLATES

### create a simple template

/templates/sample.txt

      Hello {{username}}, 

      This is a sample template of the node mailer.

      It uses mustache templating to do basic search and replaces. 

      The {{color}} {{animal}} {{adverb}} ran over the {{noun}}.

### then send the mail using some simple JSON based Mustache replacement.

      var email = require("../lib/node_mailer");

      for(var i = 0; i < 10; i++){
  
        email.send({
          host : "localhost",               // smtp server hostname
          port : "25",                     // smtp server port
          domain : "localhost",             // domain used by client to identify itself to server
          to : "marak.squires@gmail.com",
          from : "obama@whitehouse.gov",
          subject : "node_mailer test email",
          template : "../templates/sample.txt",   // path to template name
          data : {
            "username": "Billy Bob",
            "color": function(){
              var arr = ["purple", "red", "green", "yello"];
              return arr[Math.floor(Math.random()*3)];
            },
            "animal": "monkey",
            "adverb": "quickly",
            "noun": "hot lava"
          },

          authentication : "login",        // auth login is supported; anything else is no auth
          username : "my_username",        // username
          password : "my_password"         // password
        },
        function(err, result){
          if(err){ console.log(err); }
        });
      }





## Authors

Marak Squires, Elijah Insua, Fedor Indutny, Bradley Meck

