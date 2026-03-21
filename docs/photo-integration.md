# Photo Integration Debug Guide

## Environment Variables

Set these variables in `server/.env`:

```env
ID_EDITOR_TOOL_BASE_URL=http://<server-ip>:8666
ID_EDITOR_TOOL_TIMEOUT=30000
ID_EDITOR_TOOL_PUBLIC_BASE_URL=http://<server-ip>:8666
```

## Database Migration

Run the SQL in `server/sql/migrations/20260321_add_photo_tasks.sql` before starting the server, or initialize a fresh database with `server/sql/init.sql`.

## API Endpoints

### 1. Get specs

`GET /api/photo/specs`

### 2. Process photo

`POST /api/photo/process`

Form fields:
- `file`
- `sizeCode`: `one_inch` | `small_one_inch` | `two_inch`
- `backgroundColor`: `blue` | `white` | `red`
- `enhance`: `true` | `false`

### 3. Query task

`GET /api/photo/tasks/:taskId`

## Debug Checklist

1. Call `GET http://<server-ip>:8666/health` and confirm the tool is healthy.
2. Start `id-editor-server` and confirm `GET /api/photo/specs` returns static capabilities.
3. Upload a portrait image with `one_inch + blue` to `/api/photo/process`.
4. Confirm the response contains absolute `previewUrl` and `resultUrl`.
5. Query `/api/photo/tasks/:taskId` and verify the same record exists in `photo_tasks`.
6. When the tool returns `NO_FACE_DETECTED` or `IMAGE_TOO_SMALL`, verify the server returns mapped business codes.
