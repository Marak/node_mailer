var email = require("../lib/node_mailer");

for(var i = 0; i < 10; i++){
  
  email.send({
    host : "localhost",              // smtp server hostname
    port : "252",                     // smtp server port
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

