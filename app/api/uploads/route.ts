import { NextResponse } from "next/server";

import { uploadToCloudflare } from "@/lib/cloudflare";
import { connectToDatabase } from "@/lib/mongodb";
import { ImageUpload } from "@/models/ImageUpload";
import { User } from "@/models/User";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    await connectToDatabase();

    const query: { imageGroupId?: string; isDeleted: boolean } = {
      isDeleted: false,
    };

    if (userId) {
      query.imageGroupId = userId;
    }

    const uploads = await ImageUpload.find(query)
      .sort({ activityDate: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      uploads: uploads.map((upload) => ({
        id: String(upload._id),
        imageGroupId: upload.imageGroupId,
        activityDate: upload.activityDate,
        fileName: upload.fileName,
        imageUrl: upload.imageUrl,
        isDeleted: upload.isDeleted,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to fetch uploads.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const userId = String(formData.get("userId") ?? "").trim();
    const activityDate = String(formData.get("activityDate") ?? "").trim();
    const files = formData
      .getAll("files")
      .filter((file): file is File => file instanceof File);

    if (!userId || !activityDate || files.length === 0) {
      return NextResponse.json(
        { message: "userId, activityDate and at least one file are required." },
        { status: 400 },
      );
    }

    const parsedDate = new Date(activityDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { message: "activityDate is invalid." },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const user = await User.findById(userId).lean();
    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const cloudflareResult = await uploadToCloudflare(file);
        return {
          imageGroupId: userId,
          userId,
          activityDate: parsedDate,
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
          cloudflareImageId: cloudflareResult.cloudflareImageId,
          imageUrl: cloudflareResult.imageUrl,
          isDeleted: false,
        };
      }),
    );

    const savedUploads = await ImageUpload.insertMany(uploadedFiles);

    return NextResponse.json(
      {
        uploads: savedUploads.map((upload) => ({
          id: String(upload._id),
          imageGroupId: upload.imageGroupId,
          fileName: upload.fileName,
          activityDate: upload.activityDate,
          imageUrl: upload.imageUrl,
          isDeleted: upload.isDeleted,
        })),
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to upload files and save metadata.",
      },
      { status: 500 },
    );
  }
}
