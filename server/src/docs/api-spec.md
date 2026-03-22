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
- POST `/formal-wear/tasks`
- POST `/formal-wear/process`
- GET `/formal-wear/history?page=1&pageSize=10`
- GET `/formal-wear/tasks/:taskId`
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

- `/home/config` continues to return the same top-level structure with `mainCards` and `quickEntries`; current product semantics keep only one quick entry: `换装`, while preserving the existing top-level structure and jump semantics.
- `/home/templates` remains available and keeps the `tabs + templates` response structure for front-end local filtering.

- `/formal-wear/tasks` accepts multipart form-data with `file`, `gender`, `style`, `color`, and `enhance`, and returns unified formal-wear task fields for direct front-end consumption. `/formal-wear/process` is kept as a compatibility alias.
