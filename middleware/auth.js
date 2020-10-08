const jwt=require('jsonwebtoken')
const Employee= require('../models/employeeModel')

const auth = async (req,res,next) => {
    try{
       const token= req.headers.cookie.replace('jwt=','')
        const decoded=jwt.verify(token,'thisisanapp')
        const employee= await Employee.findOne({_id: decoded._id ,'tokens.token':token})
        if(!employee){
            throw new Error()
        }
        req.employee=employee
        req.token=token
        next()
    }catch(e){
        res.render('employee/404Page',{
            message:'Authentication Failed !',
            url:'/employee/login'
        })
        
    }

}


module.exports= auth