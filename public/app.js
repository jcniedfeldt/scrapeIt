//first, scrape the articles, then get the json for the articles
$.ajax("/scrape", {
  type: "GET",
  statusCode: {
    200:function (response){
      console.log("Scrape complete");
    },
    500:function (response){
      console.log("Error scraping!");
    console.log(result);
    },
    501:function (response){
      console.log("Error scraping!");
    console.log(result);
    }, success: function () {
      alert('Successful Scrape.');
   }
  }
});

$.getJSON("/articles", function (data) {
  // For each one
  for (var i = 0; i < data.length; i++) {
    // Display the apropos information on the page
    $("#articles").append(`<article class="card" data-id='${data[i]._id}'><div class="card-header"><h2>${data[i].title}</h2><p>${data[i].link}</p></div><div class="card-body">${data[i].synopsis}</div></article>`);
  }
});

function buildNote(note){
  notecard=$(`<div class="card" id="${note._id}">`);
  noteheader=$(`<div class="card-header">`);
  noteheader.append(`<h2>${note.title}</h2>`);
  notebody=$(`<div class="card-body">`);
  notebody.append(`<p>${note.body}</p>`);
  notebody.append(`<button class="delete-note" data-id="${note._id}">Delete</button>`);

  notecard.append(noteheader);
  notecard.append(notebody);
  return notecard;
}


// Whenever someone clicks a p tag
$(document).on("click", "article", function () {
  // Empty the notes from the note section
  $("#notes").empty();
  $('#newnote').empty();
  // Save the id from the p tag
  var thisId = $(this).attr("data-id");

  // Now make an ajax call for the Article
  $.ajax({
    method: "GET",
    url: "/articles/" + thisId
  })
    // With that done, add the note information to the page
    .then(function (data) {
      console.log(data);
      data.notes.forEach(note => {
        var notehtml=buildNote(note);
        $('#notes').append(notehtml);

      });
      // The title of the article
      $("#newnote").append("<h2>" + data.title + "</h2>");
      // An input to enter a new title
      $("#newnote").append("<input id='titleinput' name='title' >");
      // A textarea to add a new note body
      $("#newnote").append("<textarea id='bodyinput' name='body'></textarea>");
      // A button to submit a new note, with the id of the article saved to it
      $("#newnote").append("<button data-id='" + data._id + "' id='savenote'>Save Note</button>");

      // If there's a note in the article
      // if (data.note) {
      //   // Place the title of the note in the title input
      //   $("#titleinput").val(data.note.title);
      //   // Place the body of the note in the body textarea
      //   $("#bodyinput").val(data.note.body);
      // }
    });
});

// When you click the savenote button
$(document).on("click", "#savenote", function () {
  // Grab the id associated with the article from the submit button
  var thisId = $(this).attr("data-id");

  // Run a POST request to change the note, using what's entered in the inputs
  $.ajax({
    method: "POST",
    url: "/articles/" + thisId,
    data: {
      // Value taken from title input
      title: $("#titleinput").val(),
      // Value taken from note textarea
      body: $("#bodyinput").val()
    }
  })
    // With that done
    .then(function (data) {
      // Log the response
      console.log(data);

      var notehtml=buildNote(data.notes[data.notes.length-1]);
      $('#notes').append(notehtml);
      // Empty the notes section
      // $("#newnote").empty();
    });

  // Also, remove the values entered in the input and textarea for note entry
  $("#titleinput").val("");
  $("#bodyinput").val("");
});

$(document).on("click", ".delete-note", function () {
  // Grab the id associated with the article from the submit button
  var thisId = $(this).attr("data-id");

  // Run a POST request to change the note, using what's entered in the inputs
  $.ajax({
    method: "GET",
    url: "/api/delete-note/" + thisId,
    statusCode: {
      200:function (response){
        console.log("Deleted Note.");
        $(`#${thisId}`).remove();
      },
      500:function (response){
        console.log("Error deleting Note!");
      console.log(result);
      },
      success: function () {
        alert('Successful Note Deletion.');
     }
    }
  })

  // Also, remove the values entered in the input and textarea for note entry
  $("#titleinput").val("");
  $("#bodyinput").val("");
});