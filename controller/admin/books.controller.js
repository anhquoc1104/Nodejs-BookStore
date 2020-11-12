let Book = require("../../models/books.models.js");
let Session = require("../../models/sessions.models.js");
let User = require("../../models/users.models.js");
const change_alias = require("../../changeAlias");
let pagination = require("../../pagination");
let cloudinary = require("../avatar.controller.js");

module.exports = {
  //Create
  createPost: async (req, res) => {
    let { title, description } = req.body;
    let userId = req.signedCookies.userId;
    let avatarUrl = "";
    if (req.file) {
      await cloudinary
        .uploadCloudinary(req.file.path, 250, 300, 5)
        .then((result) => {
          avatarUrl = result.url;
          return avatarUrl;
        })
        .catch((err) => {
          console.log(err + "");
        });
    }
    if (title === "") title = "No Title";
    if (description === "") description = "No Description";

    let newBook = new Book({
      title,
      description,
      userId,
      createAt: new Date(),
      avatarUrl,
    });
    newBook.save();
    res.redirect("/");
  },

  //Search
  search: async (req, res) => {
    let page = 1;
    let { userId } = req.signedCookies;
    let user = userId && (await User.findById(userId));
    let name = req.query.name;
    name = change_alias(name);
    let books = await Book.find();
    let matchQuery = books.filter((elm) => {
      let title = elm.title;
      title = change_alias(title);
      return title.indexOf(name) !== -1;
    });

    let obj = pagination.pagination(
      user,
      page,
      8,
      "books",
      matchQuery,
      "/page/"
    );
    res.render("home.pug", obj);
  },

  //View
  view: async (req, res) => {
    let book = await Book.findById(req.params.id);
    res.render("./books/view.pug", { book });
  },

  //Edit
  edit: async (req, res) => {
    let bookId = req.params.id;
    let book = await Book.findById(bookId);
    res.render("./books/edit.pug", { book });
  },

  editPost: async (req, res) => {
    let { title, description } = req.body;
    let id = req.params.id;
    if (title === "") title = "No Title";
    if (description === "") description = "No Description";
    if (!req.file) {
      await Book.findOneAndUpdate(
        { _id: id },
        {
          title,
          description,
        }
      );
      res.redirect("/books/view/" + id);
      return;
    }
    let avatarUrl = "";
    await cloudinary
      .uploadCloudinary(req.file.path, 250, 300, 5)
      .then((result) => {
        avatarUrl = result.url;
        return avatarUrl;
      })
      .catch((err) => {
        console.log(err + "");
      });
    await Book.findOneAndUpdate(
      { _id: id },
      {
        title,
        description,
        avatarUrl,
      }
    );
    res.redirect("/books/view/" + id);
  },

  //Delete
  remove: async (req, res) => {
    let id = req.params.id;
    await Book.findOneAndDelete({ _id: id });
    res.redirect("/");
  },
};
