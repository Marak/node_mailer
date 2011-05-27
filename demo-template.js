var email = require("./lib/node_mailer");

for(var i = 0; i < 10; i++){

  email.send({
    host : "localhost",               // smtp server hostname
    port : "25",                     // smtp server port
    domain : "localhost",             // domain used by client to identify itself to server
    to : "marak.squires@gmail.com",
    from : "obama@whitehouse.gov",
    subject : "node_mailer test email",
    template : "./templates/sample.txt",   // path to template name
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
    username : undefined,            // username
    password : undefined             // password
  },
  function(err, result){
    if(err){ console.log(err); }
  });
}
