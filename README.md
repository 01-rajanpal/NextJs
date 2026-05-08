# Next.js User Details + Daily Photo Upload Starter

This repository contains a starter **Next.js (App Router)** project implementing:

- User details creation
- Daily photo upload activity per user
- Separate MongoDB collections for users and uploads
- Cloudflare Images storage integration
- FilePond uploader UI with multi-file support

## Data model

Two separate collections are used:

1. **users**
   - `name`
   - `email`

2. **imageuploads** (shared global upload table/collection)
   - `imageGroupId` (string, required)
   - `userId` (ObjectId ref User)
   - `activityDate`
   - `fileName`
   - `mimeType`
   - `size`
   - `cloudflareImageId`
   - `imageUrl`
   - `isDeleted` (boolean)

`imageGroupId` is set to the user's id, so uploads are associated through `imageGroupId`.

## Environment variables

Create `.env.local` from this example:

```bash
cp .env.example .env.local
```

Required values:

- `MONGODB_URI` - MongoDB connection string
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account id
- `CLOUDFLARE_API_TOKEN` - API token with Cloudflare Images upload permissions

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API routes

- `POST /api/users` - create user
- `GET /api/users` - list users
- `POST /api/uploads` - upload one or many photos + save metadata
- `GET /api/uploads?userId=<id>` - list non-deleted uploads by image group/user
