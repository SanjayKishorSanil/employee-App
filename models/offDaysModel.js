const mongoose= require('mongoose')

var offDaysSchema = new mongoose.Schema({
    managerId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Manager'
    },
    employeeId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Employee'
    },
    fromDate:{
        type:String,
        required:true
    },
    toDate:{
        type:String,
        required:true
    },reason:{
        type:String,
        required:true
    },
    noOfDays:{
        type:Number,
        required:true
    },
    status:{
        type:String,
        default:'Pending'
    }
})


const offDays= mongoose.model('OffDays',offDaysSchema)

module.exports= offDays