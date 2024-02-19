const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const appointmentSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        validate(value){
            if(!validator.isEmail(value))
            {
                throw new Error("Email is invalid");
            }
        }
    },
    date:{
        type:String,
        required:true
    },
    
    doctor:{
        type:String,
        required:true
    },
    time:{
        type:String,
        required:true
    },
});

const Appointment = new mongoose.model("Appointment",appointmentSchema);
module.exports = Appointment;