const BookInstance = require("../models/bookinstance");
const Book = require("../models/book");

const async = require("async");
const { body, validationResult } = require("express-validator");


// Display lits of all BookInstances
exports.bookinstance_list = (req, res, next) => {
 // res.send("NOT IMPLEMENTED: BookInstance list");
 BookInstance.find()
  .populate("book")
  .exec(function (err, list_bookinstances) {
   if (err) {
    return next(err);
   }
   // Successful, so render
   res.render("bookinstance_list", {
    title: "Book Instance List",
    bookinstance_list: list_bookinstances
   });
  });
};

// Display detail page for a specific BookInstance
exports.bookinstance_detail = (req, res, next) => {
//  res.send(`NOT IMPLEMENTED: BookInstance detail: ${req.params.id}`);
  BookInstance.findById(req.params.id)
    .populate("book")
    .exec((err, bookinstance) => {
      if (err) {
        return next(err);
      }
      if (bookinstance == null) {
        // No results
        const err = new Error("Book copy not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render
      res.render("bookinstance_detail", {
        title: `Copy: ${bookinstance.book.title}`,
        bookinstance
      });
    });
};

// Display BookInstance create form on GET
exports.bookinstance_create_get = (req, res, next) => {
//  res.send("NOT IMPLEMENTED: BookInstance create GET");
  Book.find({}, "title").exec((err, books) => {
    if (err) {
      return next(err);
    }
    // Successful, so render
    res.render("bookinstance_form", {
      title: "Create BookInstance",
      book_list: books
    });
  });
};

// // Handle BookInstance create on POST
// exports.bookinstance_create_post = (req, res) => {
//  res.send("NOT IMPLEMENTED: BookInstance create POST");
// };
// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  // Validate and sanitize fields.
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped and trimmed data.
    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values and error messages.
      Book.find({}, "title").exec(function (err, books) {
        if (err) {
          return next(err);
        }
        // Successful, so render.
        res.render("bookinstance_form", {
          title: "Create BookInstance",
          book_list: books,
          selected_book: bookinstance.book._id,
          errors: errors.array(),
          bookinstance,
        });
      });
      return;
    }

    // Data from form is valid.
    bookinstance.save((err) => {
      if (err) {
        return next(err);
      }
      // Successful: redirect to new record.
      res.redirect(bookinstance.url);
    });
  },
];

// Display BookInstance delete form on GET
exports.bookinstance_delete_get = (req, res, next) => {
//  res.send("NOT IMPLEMENTED: BookInstance delete GET");
  async.parallel(
    {
      bookinstance(callback) {
        BookInstance.findById(req.params.id).exec(callback);
      }
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.bookinstance == null) {
        // No results
        res.redirect("/catalog/bookinstances");
      }
      // Successful, so render
      res.render("bookinstance_delete", {
        title: "Delete BookInstance",
        bookinstance: results.bookinstance,
      });
    }
  );
};

// handle BookInstance delete on POST
exports.bookinstance_delete_post = (req, res, next) => {
//  res.send("NOT IMPLEMENTED: BookInstance delete POST");
  async.parallel(
    {
      bookinstance(callback) {
        BookInstance.findById(req.body.bookinstanceid).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      // Success
      if (results.bookinstance > 0) {
        res.render("bookinstance_delete", {
          title: "Delete BookInstance",
          bookinstance: results.bookinstance
        });
        return;
      }
      // Delete object and redirect to the list of bookinstances
      BookInstance.findByIdAndRemove(req.body.bookinstanceid, (err) => {
        if (err) {
          return next(err);
        }
        // Success — go to bookinstance list
        res.redirect("/catalog/bookinstances");
      });
    }
  )
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function (req, res, next) {
  // Get book, authors and genres for form.
  async.parallel(
    {
      bookinstance (callback) {
        BookInstance.findById(req.params.id)
        .populate("book")
        .exec(callback);
      },
      books (callback) {
        Book.find(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.bookinstance == null) {
        // No results.
        const err = new Error("Book copy not found");
        err.status = 404;
        return next(err);
      }
      // Success.
      res.render("bookinstance_form", {
        title: "Update BookInstance",
        book_list: results.books,
        selected_book: results.bookinstance.book._id,
        bookinstance: results.bookinstance,
      });
    }
  );
};

// Handle BookInstance update on POST.
exports.bookinstance_update_post = [
  // Validate and sanitize fields.
  body("book", "Book must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status")
    .escape(),
  body("due_back", "Invalid date")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped/trimmed data and current id.
    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      // There are errors so render the form again, passing sanitized values and errors.
      Book.find({}, "title").exec(function (err, books) {
        if (err) {
          return next(err);
        }
        // Successful, so render.
        res.render("bookinstance_form", {
          title: "Update BookInstance",
          book_list: books,
          selected_book: bookinstance.book._id,
          errors: errors.array(),
          bookinstance,
        });
      });
      return;
    } else {
      // Data from form is valid.
      BookInstance.findByIdAndUpdate(
        req.params.id,
        bookinstance,
        {},
        (err, thebookinstance) => {
          if (err) {
            return next(err);
          }
          // Successful - redirect to detail page.
          res.redirect(thebookinstance.url);
        }
      );
    }
  },
];
















// // Display BookInstance update form on GET
// exports.bookinstance_update_get = (req, res, next) => {
// //  res.send("NOT IMPLEMENTED: BookInstance update GET");
//   async.parallel(
//     {
//       bookinstance(callback) {
//         BookInstance.findById(req.params.id)
//         .populate("book")
//         .exec(callback);
//       },
//       books(callback) {
//         Book.find(callback);
//       },
//     },
//     (err, results) => {
//       if (err) {
//         return next(err);
//       }
//       if (results.bookinstance == null) {
//         // No results
//         const err = new Error("BookInstance not found");
//         err.status = 404;
//         return next(err);
//       }
//       res.render("bookinstance_form", {
//         title: "Update BookInstance",
//         books: results.books,
//         bookinstance: results.bookinstance
//       });
//     }
//   );
// };

// // // Handle BookInstance update on POST
// // exports.bookinstance_update_post = (req, res, next) => {
// // //  res.send("NOT IMPLEMENTED: BookInstance update POST");

// // };

// // Handle BookInstance update on POST
// exports.bookinstance_update_post = [
//   // Validate and sanitize fields.
//   body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
//   body("imprint", "Imprint must be specified")
//     .trim()
//     .isLength({ min: 1 })
//     .escape(),
//   body("status").escape(),
//   body("due_back", "Invalid date")
//     .optional({ checkFalsy: true })
//     .isISO8601()
//     .toDate(),

//   // Process request after validation and sanitization
//   (req, res, next) => {
//     // Extract the validation errors from a request
//     const errors = validationResult(req);

//     // Create a BookInstance object with escaped/trimmed data and old id
//     const bookinstance = new BookInstance({
//       book: req.body.book,
//       imprint: req.body.imprint,
//       staus: req.body.status,
//       due_back: req.body.due_back,
//       _id: req.params.id //This is required, or a new Id will be assigned!
//     });

//     if (!errors.isEmpty()) {
//       // There are errors. Render form again with sanitized values/error messages

//       // Get all books for form
//       async.parallel(
//         {
//           books(callback) {
//             Book.find(callback);
//           },
//         },
//         (err, results) => {
//           if (err) {
//             return next(err);
//           }

//           res.render("bookinstance_form", {
//             title: "Update BookInstance",
//             books: results.books,
//             bookinstance,
//             errors: errors.array()
//           });
//         }
//       );
//       return;
//     }

//     // Data from form is valid. Update the record.
//     BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, (err, thebookinstance) => {
//       if (err) {
//         return next(err);
//       }

//       // Successful: redirect to bookinstance detail page
//       res.redirect(thebookinstance.url);
//     });
//   }
// ];