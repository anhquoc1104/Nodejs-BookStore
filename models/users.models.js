const mongoose = require("../mongoose.js");

let userSchema = mongoose.Schema(
  {
    name: String,
    email: String,
    ssn: Number,
    password: String,
    birthdate: Date,
    address: String,
    status: {
      type: String,
      default: "true",
    },
    isAdmin: {
      type: String,
      default: "false",
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    createAt: {
      type: Date,
      default: new Date(),
    },
    wrongLoginCount: Number,
    idTransaction: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },
    idCart: {
      type: [],
      default: [],
    },
  },
  {
    autoCreate: true,
  }
);

let User = mongoose.model("User", userSchema, "users");

module.exports = User;
