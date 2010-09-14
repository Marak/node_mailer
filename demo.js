var email = require("./lib/node_mailer");

for(var i = 0; i < 5; i++){

  email.send({
    host : "localhost",              // smtp server hostname
    port : "1025",                     // smtp server port
    domain : "localhost",            // domain used by client to identify itself to server
    to : "marak.squires@gmail.com",
    from : "obama@whitehouse.gov",
    subject : "node_mailer test email",
    body : "hello this is a test email from the node_mailer",

    authentication : "login",        // auth login is supported; anything else is no auth
    username : "dXNlcm5hbWU=",       // Base64 encoded username
    password : "cGFzc3dvcmQ=",       // Base64 encoded password

  });


  email.send({
    host : "localhost",              // smtp server hostname
    port : "1026",                     // smtp server port
    domain : "localhost",            // domain used by client to identify itself to server
    to : "marak.squires@gmail.com",
    from : "obama@whitehouse.gov",
    subject : "node_mailer test email 2",
    body : "hello this is a test email from the node_mailer",

    authentication : "login",        // auth login is supported; anything else is no auth
    username : "dXNlcm5hbWU=",       // Base64 encoded username
    password : "cGFzc3dvcmQ=",       // Base64 encoded password

  });


}

