const mongoose = require('mongoose');


var managerSchema = new mongoose.Schema({
    managerId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Employee'
    },
    reportees:[{
        reportee:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'Employee'
        }
        
        
    }],
    taskAssigned:{
        type:String,
        default:'Not Assigned'
    }
});



const Manager=mongoose.model('Manager', managerSchema);
module.exports=Manager
