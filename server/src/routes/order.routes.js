const r=require('express').Router(); const c=require('../controllers/order.controller'); r.post('/',c.create); r.get('/:orderId',c.detail); r.post('/:orderId/mock-pay',c.mockPay); module.exports=r;
