const adminService=require('../services/admin.service'); const { success }=require('../utils/api-response'); module.exports={ async stats(req,res){ success(res, await adminService.stats()); } };
