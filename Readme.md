send emails from node.js to your smtp server, simple as cake.

USAGE

var email = require("./node_mailer");

email.send({
  to : "marak.squires@gmail.com",
  from : "obama@whitehouse.gov",
  subject : "node_mailer test email",
  body : "hello this is a test email from the node_mailer"
});
	      