const jwt = require("jsonwebtoken");
const Register = require("../models/registers");
const Registerstaff =require("../models/registerstaffs");
const SECRET_KEY = "mynameisshivamkumariamfromiiitmanipuriamfromcse";
const SECRET_KEY2 = "mynameisshivamkumariamalsokeshavkumarandilovemycountry";
const auth = async (req, res, next) => {
    try {

        const token = req.cookies.jwt;
        const verifyUser = jwt.verify(token, SECRET_KEY);
        // console.log(verifyUser);

        const user = await Register.findOne({ _id: verifyUser._id });
        // console.log(user);
        
        req.token = token;
        req.user = user;

        next();
    }
    catch (error) {
        res.status(401).send(error);
    }
}
const auth2 = async (req, res, next) => {
    try {

        const token = req.cookies.jwt;
        const verifyUser = jwt.verify(token, SECRET_KEY2);
        // console.log(verifyUser);

        const user = await Registerstaff.findOne({ _id: verifyUser._id });
        // console.log(user);
        
        req.token = token;
        req.user = user;

        next();
    }
    catch (error) {
        res.status(401).send(error);
    }
}

module.exports = {
    auth,
    auth2
};

