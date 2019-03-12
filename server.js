require("dotenv").config();
var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI);
// mongoose.connect("mongodb://localhost/unit18Populater", { useNewUrlParser: true });

// Routes

// A GET route for scraping the echoJS website
app.get("/scrape", function (req, res) {
  axios.get("https://www.techradar.com/news").then(function (response) {
    var $ = cheerio.load(response.data);

    let newsSection = $(".news .listingResult").each(function (i, listing) {
      // console.log(listing);
      let result = {};
      result.link = $(this).children('a').attr("href");
      result.title = $(this).find(".article-name").text();
      result.synopsis = $(this).find(".synopsis").text();
      result.title = $(this).find(".article-name").text();
      result.datetime = $(this).find("time").attr("datetime");

      // TODO get images
      // console.log(result);

      //First, check if the article is already in the database
      if (result.link != null) {
        db.Article.find({ link: result.link })
          .then(function (articles) {
            if (articles.length > 0) {
              // console.log(`Article with link: ${result.link} already exists.`);
            } else {
              db.Article.create(result)
                .then(function (dbArticle) {
                  // View the added result in the console
                  // console.log(dbArticle);
                  console.log(`Added article ${result.title}`);
                })
                .catch(function (err) {
                  // If an error occurred, log it
                  console.log(err);
                  console.log(result);
                  res.sendStatus(501);
                });
            }
            // console.log(`Found article with link: ${result.link}`);
          })
          .catch(function (err) {
            console.log(err);
            res.sendStatus(500);

          });
      }
    });
    // res.json(result);
    // console.log("Finished Scrape!");
    res.sendStatus(200);
  });
});

// Route for getting all Articles from the db
app.get("/articles", function (req, res) {
  // Grab every document in the Articles collection
  db.Article.find({})
    .then(function (dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("notes")
    .then(function (dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function (req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function (dbNote) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.findOneAndUpdate({ _id: req.params.id }, {$push:{ notes: dbNote._id }}, { new: true })
        .populate("notes");
    })
    .then(function (dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});
