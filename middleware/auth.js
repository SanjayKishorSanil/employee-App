const jwt=require('jsonwebtoken')
const Employee= require('../models/employeeModel')

const auth = async (req,res,next) => {
    try{
       const token= req.headers.cookie.replace('jwt=','')
        console.log('token',token)
        const decoded=jwt.verify(token,'thisisanapp')
        console.log('decoded',decoded)
        const employee= await Employee.findOne({_id: decoded._id ,'tokens.token':token})
        if(!employee){
            throw new Error()
        }
        req.employee=employee
        req.token=token
        next()
        console.log('sucessfully authenticated !!')
    }catch(e){
        console.log(e)
        res.status(401).send('Authentication failed')
        
    }

}


module.exports= auth