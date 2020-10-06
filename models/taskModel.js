const mongoose = require('mongoose')

var taskSchema= new mongoose.Schema({
    managerId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Manager'
    },
    employeeId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Employee'
    },
    task:{
        type:String
    },
    status:{
        type:String,
        default:'pending'
    },
    remark:{
        type:String,
        default:'No Remarks'
    }

})

const Task= mongoose.model('Tasks',taskSchema)
module.exports=Task