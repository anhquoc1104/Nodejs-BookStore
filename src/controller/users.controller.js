const bcrypt = require("bcrypt");

let User = require("../models/users.models.js");
const Constant = require("../services/constant");

let cloudinary = require("./avatar.controller.js");

module.exports = {
    home: async (req, res) => {
        let user = await User.findById(req.signedCookies.userId);
        try {
            res.render("./users/view.pug", {
                user,
                mess: req.flash("message"),
            });
        } catch (error) {
            console.log(error);
        }
    },

    editInfoPost: async (req, res) => {
        let { name, phone, birthdate, address } = req.body;
        let idUser = req.signedCookies.userId;
        let regexPhone = /^[+]?[(]?[0-9]{3}[)]?[-s.]?[0-9]{3}[-s.]?[0-9]{4,6}$/im;
        /*
            // Valid formats:
            (123) 456-7890
            (123)456-7890
            123-456-7890
            123.456.7890
            1234567890
            +31636363634
            075-63546725
        */
        let user = await User.findById(idUser);

        //Change Info
        let avatarUrl = user.avatarUrl;
        let file = req.file;

        //name not Empty
        if (name === "") name = user.name;
        if (birthdate === "") birthdate = user.birthdate;

        //noChange
        if (
            name === user.name &&
            phone === user.phone &&
            birthdate === user.birthdate &&
            address === user.address &&
            !file
        ) {
            req.flash("message", Constant.SUCCESS_COMMON);
            res.redirect("/users");
            return;
        }

        // Change avatar
        if (file) {
            await cloudinary
                .uploadCloudinary(file.path, 150, 150, 75)
                .then(async (result) => {
                    return (avatarUrl = result.url);
                })
                .catch((err) => {
                    console.log(err + "");
                });
        }

        //Validate Phone Number
        if (!regexPhone.test(phone)) {
            phone = "";
        }

        await User.findOneAndUpdate(
            { _id: idUser },
            { name, phone, birthdate, address, avatarUrl }
        );
        req.flash("message", Constant.SUCCESS_COMMON);
        res.redirect("/users");
    },

    editPasswordPost: async (req, res) => {
        let { oldPassword, newPassword, retypePassword } = req.body;
        let idUser = req.signedCookies.userId;
        let user = await User.findById(idUser);

        //Change Password
        if (!oldPassword || !newPassword || !retypePassword) {
            req.flash("message", Constant.ERROR_FIELD_EMPTY);
            res.redirect("/users");
            return;
        }
        if (!bcrypt.compareSync(oldPassword, user.password)) {
            req.flash("message", Constant.ERROR_PASSWORD_WRONG);
            res.redirect("/users");
            return;
        }
        if (newPassword !== retypePassword) {
            req.flash("message", Constant.ERROR_PASSWORD_NOT_MATCH);
            res.redirect("/users");
            return;
        }
        let password = bcrypt.hashSync(retypePassword, 10);
        await User.findOneAndUpdate({ _id: idUser }, { password });
        req.flash("message", Constant.SUCCESS_COMMON);
        res.redirect("/users");
        return;
    },
};
