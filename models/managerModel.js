const mongoose = require('mongoose');
const bcrypt=require('bcryptjs')

var managerSchema = new mongoose.Schema({
    managerId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Employee'
    },
    reportee:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Employee'
        
    }
});



const Manager=mongoose.model('Manager', managerSchema);
module.exports=Manager
