const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SECRET_KEY = "mynameisshivamkumariamfromiiitmanipuriamfromcse";

const adminSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true
    },
    password:{
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
adminSchema.methods.generateAuthToken = async function(){
    try{
        // const token = jwt.sign({_id:this._id.toString()}, process.env.SECRET_KEY);
        const token = jwt.sign({_id:this._id.toString()}, SECRET_KEY);
        this.tokens = this.tokens.concat({token:token});
        console.log(token);
        await this.save();
        return token;
    }
    catch(error){
            res.send("the error part" + error);
            console.log("the error part" + error);
    }
};

adminSchema.pre("save",async function (next){
    if(this.isModified("password")){
// console.log(`the current password is ${this.password}`);

  this.password =  await bcrypt.hash(this.password,10);
  
    }
next();
});
const Admindata = new mongoose.model("Admin",adminSchema);


module.exports = Admindata;




