const mongoose = require('mongoose');
const express = require("express");
const app = express();

mongoose.connect("mongodb://127.0.0.1:27017/hospital")
.then(()=>{
    console.log("connection sucessfull");
})
.catch((error)=>{
    console.log(error);
})
