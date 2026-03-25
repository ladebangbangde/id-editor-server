# API Spec

Base URL: `/api`

- GET `/home/config`
- GET `/home/templates?category=popular`
- GET `/spec/categories`
- GET `/spec/list?category=hot&page=1&pageSize=20`
- GET `/spec/detail/:id`
- GET `/scenes`
- GET `/scenes/:sceneKey`
- GET `/auth/me`
- POST `/upload`
- POST `/images/generate`
- POST `/formal-wear/tasks` (已下线兼容接口)
- POST `/formal-wear/process` (已下线兼容接口)
- GET `/formal-wear/history?page=1&pageSize=10` (已下线兼容接口)
- GET `/formal-wear/tasks/:taskId` (已下线兼容接口)
- GET `/formal-wear/tasks/:taskId/edit-draft` (已下线兼容接口)
- GET `/tasks/:taskId`
- GET `/images/history?page=1&pageSize=10`
- GET `/images/:imageId/detail`
- POST `/orders`
- GET `/orders/:orderId`
- POST `/orders/:orderId/mock-pay`
- GET `/download/:resultId/preview`
- GET `/download/:resultId/hd`
- GET `/download/:resultId/print`
- GET `/admin/stats`

## Notes

- `/home/config` 保持 `mainCards + quickEntries` 结构不变；换装入口已移除，`quickEntries` 为空数组。
- `/home/templates` 保持 `tabs + templates` 返回结构不变。
- 所有 `/formal-wear/*` 兼容接口统一返回 HTTP 410 与提示文案：`该功能已下线`。
