var email = require("./lib/node_mailer");

for(var i = 0; i < 1; i++){
  email.send({
    ssl: true,
    host : "smtp.gmail.com",              // smtp server hostname
    port : 465,                     // smtp server port
    domain : "[127.0.0.1]",            // domain used by client to identify itself to server
    to : "bradley.meck@gmail.com",
    from : "bradley.meck@gmail.com",
    subject : "node_mailer test email",
    reply_to:"bradley@bradleymeck.com",
    body: "Hello! This is a test of the node_mailer.",
    authentication : "login",        // auth login is supported; anything else is no auth
    username : undefined,            // username
    password : undefined,            // password
    debug: true                      // log level per message
  },
  function(err, result){
    if(err){ console.log(err); }
  });
}
