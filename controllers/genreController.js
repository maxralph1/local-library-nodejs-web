const Genre = require("../models/genre");
const Book = require("../models/book");
// const mongoose = require("mongoose");

const async = require("async");
const { body, validationResult } = require("express-validator");


// Display list of all Genres
exports.genre_list = (req, res, next) => {
 // res.send("NOT IMPLEMENTED: Genre list");
 Genre.find()
  .sort([["name", "ascending"]])
  .exec(function (err, list_genres) {
   if (err) {
    return next(err);
   }
   // Successful, so render
   res.render("genre_list", {
    title: "Genre List",
    genre_list: list_genres
   });
  });
};

// Display detail page for a specific genre
exports.genre_detail = (req, res, next) => {
 // res.send(`NOT IMPLEMENTED: Genre detail: ${req.params.id}`);
 // const id = mongoose.Types.ObjectId(req.params.id);
 async.parallel(
  {
   genre(callback) {
    Genre.findById(req.params.id).exec(callback);
   },
   genre_books(callback) {
    Book.find({ genre: req.params.id }).exec(callback);
   },
  },
  (err, results) => {
   if (err) {
    return next(err);
   }
   if (results.genre == null) {
    // No results
    const err = new Error("Genre not found");
    err.status = 404;
    return next(err);
   }
   // Successful, so render
   res.render("genre_detail", {
    title: "Genre Detail",
    genre: results.genre,
    genre_books: results.genre_books
   });
  }
 );
};

// Display Genre create form on GET
exports.genre_create_get = (req, res, next) => {
//  res.send("NOT IMPLEMENTED: Genre create GET");
  res.render("genre_form", { title: "Create Genre" });
};

// Handle Genre create on POST
// exports.genre_create_post = (req, res) => {
exports.genre_create_post = [
//  res.send("NOT IMPLEMENTED: Genre create POST");
  // Validate and sanitize the name field
  body("name", "genre name required").trim().isLength({ min: 1 }).escape(),

  // Process request after validation and sanitization
  (req, res, next) => {
    // Extract the validation errors from a request
    const errors = validationResult(req);

    // Create a genre object with escaped and trimmed data
    const genre = new Genre({ name: req.body.name });

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages
      res.render("genre_form", {
        title: "Create Genre",
        genre,
        errors: errors.array()
      });
      return;
    } else {
      // Data from form is valid
      // Check if Genre with same name already exists
      Genre.findOne({ name: req.body.name }).exec((err, found_genre) => {
        if (err) {
          return next(err);
        }

        if (found_genre) {
          // Genre exists, redirect to its detail page
          res.redirect(found_genre.url);
        } else {
          genre.save((err) => {
            if (err) {
              return next(err);
            }
            // Genre saved. Redirect to genre detail page.
            res.redirect(genre.url);
          });
        }
      });
    }
  },
// };
];

// Display Genre delete form on GET
exports.genre_delete_get = (req, res, next) => {
//  res.send("NOT IMPLEMENTED: Genre delete GET");
  async.parallel(
    {
      genre(callback) {
        Genre.findById(req.params.id).exec(callback);
      },
      genres_books(callback) {
        Book.find({ genre: req.params.id }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.genre == null) {
        // No results
        res.redirect("/catalog/genres");
      }
      // Successful, so render
      res.render("genre_delete", {
        title: "Delete Genre",
        genre: results.genre,
        genre_books: results.genres_books
      });
    }
  );
};

// Handle Genre delete on POST
exports.genre_delete_post = (req, res, next) => {
//  res.send("NOT IMPLEMENTED: Genre delete POST");
  async.parallel(
    {
      genre(callback) {
        Genre.findById(req.body.genreid).exec(callback);
      },
      genres_books(callback) {
        Book.find({ genre: req.body.genreid }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      // Success
      if (results.genres_books.length > 0) {
        // Genre has books. Render in same way as for GET route
        res.render("genre_delete", {
          title: "Delete Genre",
          genre: results.genre,
          genre_books: results.genres_books
        });
        return;
      }
      // Genre has no books. Delete object and redirect to the list of genres
      Genre.findByIdAndRemove(req.body.genreid, (err) => {
        if (err) {
          return next(err);
        }
        // Success — go to genre list
        res.redirect("/catalog/genres");
      });
    }
  );
};

// Display Genre update form on GET
exports.genre_update_get = (req, res, next) => {
//  res.send("NOT IMPLEMENTED: Genre update GET");
  async.parallel(
    {
      genre(callback) {
        Genre.findById(req.params.id).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.genre == null) {
        // No results
        const err = new Error("genre not found");
        err.status = 404;
        return next(err);
      }
      res.render("genre_form", {
        title: "Update Genre",
        genre: results.genre
      });
    }
  );
};

// Handle Genre update on POST
exports.genre_update_post = [
//  res.send("NOT IMPLEMENTED: Genre update POST");
  body("name", "genre name required").trim().isLength({ min: 1 }).escape(),

  // Process request after validation and sanitization
  (req, res, next) => {
    // Extract the validation errors from a request
    const errors = validationResult(req);

    // Create a Genre object with escaped/trimmed data and old id
    const genre = new Genre({
      name: req.body.name,
      _id: req.params.id //This is required, or a new ID will be assigned!
    })

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/errors messages.
      res.render("genre_form", {
        title: "Update Genre",
        genre,
        errors: errors.array()
      });
      return;
    }
    // Data from form is valid. Update the record.
    Genre.findByIdAndUpdate(req.params.id, genre, {}, (err, thegenre) => {
      if (err) {
        return next(err);
      }

      // SUccessful: redirect to genre detail page
      res.redirect(thegenre.url);
    });
    
  }
];

// // Handle Genre update on POST
// exports.genre_update_post = (req, res) => {
// //  res.send("NOT IMPLEMENTED: Genre update POST");
// };