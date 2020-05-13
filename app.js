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
// setting ejs as view engine
app.set("view engine", "ejs");

// storing ports for production and development
const PORT = (process.env.PORT || 3000);

// loading sign up landing page
app.get("/", function(req, res) {
  res.render("signup");
});

// handling sign up request
app.post("/", function(req, res) {
  // getting form data from bodyParser
  const form = req.body;
  // creating data object to be posted to Mailchimp servers
  const data = {
    members: [{
      email_address: form.email,
      status: "subscribed",
      merge_fields: {
        FNAME: form.firstName,
        LNAME: form.lastName
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
      // logging errors returned
      console.log(status.errors);
      console.log("Error count: " + status.error_count);
      // signup successful
      if (!status.error_count) {
        // rendering success page
        res.render("status", {
          error: 0
        });
        // signup failed
      } else {
        // rendering failure page
        res.render("status", {
          message: status.errors[0].error,
          error: 1
        });
      }
    });
  });

  // posting data to Mailchimp servers
  request.write(packedData);
  request.end();
});

// starting server
app.listen(PORT, function() {
  console.log("Server running on port " + PORT);
});
