const jwt=require('jsonwebtoken')
const Employee= require('../models/employeeModel')

const auth = async (req,res,next) => {
    try{
        const token=req.header('Authorization').replace ('Bearer ','')
        console.log(token)
        const decoded=jwt.verify(token,'thisisanapp')
        console.log(decoded)
        const employee= await Employee.findOne({_id: decoded._id ,'tokens.token':'token'})
        if(!employee){
            throw new Error()
        }
        req.employee=employee
        next()
    }catch(e){
        res.status(401).send('Authentication failed')
    }

}


module.exports= auth