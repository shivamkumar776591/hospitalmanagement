const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SECRET_KEY = "mynameisshivamkumariamfromiiitmanipuriamfromcse";

const patientSchema = new mongoose.Schema({
    firstname:{
        type:String,
        required :true,
    },
    lastname:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        validate(value){
            if(!validator.isEmail(value))
            {
                throw new Error("Email is invalid");
            }
        }
    },
    gender:{
        type:String,
        required:true
    },
    phonenumber:{
        type:Number,
        required:true
    },
    age:{
        type:Number,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    confirmpassword:{
        type:String,
        required:true
    },
    img:
    {
        data: Buffer,
        contentType: String
    },
    tokens:[{ 
        token:{
            type:String,
            required:true
        }
    }]
});
// generating token 
patientSchema.methods.generateAuthToken = async function(){
    try{
        // const token = jwt.sign({_id:this._id.toString()}, process.env.SECRET_KEY);
        const token = jwt.sign({_id:this._id.toString()}, SECRET_KEY);

        this.tokens = this.tokens.concat({token:token});
        console.log(token);
        await this.save();
        return token;
    }
    catch(error){
            // res.send("the error part" + error);
            throw(error);
            console.log("the error part" + error);
    }
};

patientSchema.pre("save",async function (next){
    if(this.isModified("password")){
// console.log(`the current password is ${this.password}`);

  this.password =  await bcrypt.hash(this.password,10);
  this.confirmpassword =  await bcrypt.hash(this.password,10);
    }
next();
});

const Register = new mongoose.model("Register",patientSchema);

module.exports = Register;