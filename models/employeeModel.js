const mongoose = require('mongoose');
const bcrypt=require('bcryptjs')

var employeeSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: 'This field is required.'
    },
    email: {
        type: String
    },
    mobile: {
        type: String
    },
    city: {
        type: String
    },
    jobRole:{
        type:String
    },
    salary:{
        type:String,
        default:0
    },
    password:{
        type:String,
        required:true
    }
});


employeeSchema.path('email').validate((val) => {
    emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return emailRegex.test(val);
}, 'Invalid e-mail.');



employeeSchema.statics.findByCredentials = async (email,password) => {
    const user= Employee.findOne({email}) 
    console.log(user)
    if(!user){
       return new Error('unable to login')
    }
    const isMatch= await bcrypt.compare(password,user.password)

    if(!isMatch){
        return new Error ('unable to login')
        
    }
    return user

}

employeeSchema.pre('save',async function(next){
    const user=this

    if(user.isModified('password')){
        user.password=await bcrypt.hash(user.password,8)
    }
    next()
})
const Employee=mongoose.model('Employee', employeeSchema);
module.exports=Employee
