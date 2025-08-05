import mongoose from "mongoose";


export const connectDB = () =>{
   try{
    mongoose.connect('mongodb://127.0.0.1:27017/skayShare');
    console.log('Connected to Database!');
   }
   catch(error){
    console.log('unable to Connected Database!');
   }
}