const { success }=require('../utils/api-response'); module.exports={ me:(req,res)=>success(res, req.user), adminLogin:(req,res)=>success(res,{token:'mock-admin-token'}) };
