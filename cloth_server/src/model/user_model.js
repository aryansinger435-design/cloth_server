import mongoose from "mongoose";


const userSchema  = new mongoose.Schema({
    profile_img:{type:Object},
    first_name: {type:String,required:true},
      last_name: {type:String,required:true},
        gender: {type:String,enum:['male','female','other'],required:true},
         role: {type:String,enum:['admin','user'],required:true},
         email: {type:String,required:true,unique:true},
         password: {type:String,required:true},
              is_active: {type:Boolean,required:true},
                   is_deleted: {type:Boolean,required:true},
                   address_list:{type:Array,required:true},
                    is_address_list:{type:Boolean,required:true},
                   verfication:{
                    user:{
                        otp:{type:String},
                        is_verified:{type:Boolean},
                        is_expired_time:{type:Number},
                          is_expired_otp:{type:Boolean},
                          otp_attempt:{type:Number,default:3},
                          lock_time:{type:Number}
                    },
                    admin:{

                    }

                   },
                   order_list:{type:mongoose.Schema.Types.ObjectId,ref:'order'},
                    cart_list:{type:mongoose.Schema.Types.ObjectId,ref:'order'},
},{
    timestamps:true
})


export default mongoose.model('user',userSchema)