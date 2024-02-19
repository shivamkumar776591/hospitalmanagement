const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SECRET_KEY2 = "mynameisshivamkumariamalsokeshavkumarandilovemycountry";

const staffSchema = new mongoose.Schema({
    name:{
        type:String,
        required :true,
    },
    id:{
        type:Number,
        required :true,
        unique:true
    },
    username:{
        type:String,
        required:true,
        unique:true
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
    dob:{
        type:String,
        required:true
    },
    department:{
        type:String,
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
    tokens:[{ 
        token:{
            type:String,
            required:true
        }
    }]
});
// generating token 
staffSchema.methods.generateAuthToken = async function(){
    try{
        // const token = jwt.sign({_id:this._id.toString()}, process.env.SECRET_KEY2);
        const token = jwt.sign({_id:this._id.toString()}, SECRET_KEY2);
        this.tokens = this.tokens.concat({token:token});
        //  console.log(token);
        await this.save();
        return token;
    }
    catch(error){
            res.send("the error part" + error);
            console.log("the error part" + error);
    }
};

staffSchema.pre("save",async function (next){
    if(this.isModified("password")){
// console.log(`the current password is ${this.password}`);
  this.password =  await bcrypt.hash(this.password,10);
  this.confirmpassword =  await bcrypt.hash(this.password,10);
    }
next();
});
const Registerstaff = new mongoose.model("staff",staffSchema);

module.exports = Registerstaff;