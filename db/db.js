import mongoose from "mongoose";


export const connectDB = () =>{
   try{
    mongoose.connect(process.env.DB_URL);
    console.log('Connected to Database!');
   }
   catch(error){
    console.log('unable to Connected Database!');
   }
}