// importing modules
const express = require("express");
const bodyParser = require("body-parser");
const https = require("https");
// managing environment variables for production and development cases
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({
    silent: true
  });
}
const app = express();
// using static files and body-parser
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
  extended: true
}));
// storing ports for production and development
const PORT = (process.env.PORT || 3000);

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/signup.html");
});

app.post("/", function(req, res) {
  // getting form data from bodyParser
  const form = req.body;
  // getting user input from individual text fields
  const firstName = form.firstName;
  const lastName = form.lastName;
  const email = form.email;
  // creating data object to be posted to Mailchimp servers
  const data = {
    members: [{
      email_address: email,
      status: "subscribed",
      merge_fields: {
        FNAME: firstName,
        LNAME: lastName
      }
    }]
  };
  // packing the data into a string before sending to Mailchimp
  const packedData = JSON.stringify(data);

  // getting the mailchimp 'audience unique ID' and 'API key' from the .env file
  const LIST_ID = process.env.MAILCHIMP_LIST_ID;
  const API_KEY = process.env.MAILCHIMP_API_KEY;
  // getting the last 3 characters from the API key to create the endpoint
  const usX = API_KEY.slice(-3);
  // creating the request URL using LIST_ID and API_KEY
  const url = "https://" + usX + ".api.mailchimp.com/3.0/lists/" + LIST_ID;
  // creating the options object
  const options = {
    method: "POST",
    // basic HTTPs authenctication username:password
    auth: "BlackRoseSociety:" + API_KEY
  };

  // creating the POST request
  const request = https.request(url, options, function(response) {
    response.on("data", function(data) {
      // parsing data into JSON format
      const status = JSON.parse(data);
      // logging data returned
      console.log(status.new_members);
      console.log(status.updated_members);
      console.log(status.errors);
      console.log("Error count: " + status.error_count);
      // checking status for success or failure
      if (!status.error_count)
        res.sendFile(__dirname + "/success.html");
      else
        res.sendFile(__dirname + "/failure.html");
    });
  });
  
  // posting data to Mailchimp servers
  request.write(packedData);
  request.end();
});

app.listen(PORT, function() {
  console.log("Server running on port " + PORT);
});
