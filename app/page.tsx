import UserDetailsWorkflow from "@/app/components/UserDetailsWorkflow";
import { connectToDatabase } from "@/lib/mongodb";
import { ImageUpload } from "@/models/ImageUpload";
import { User } from "@/models/User";

type UserSummary = {
  id: string;
  name: string;
  email: string;
};

type UploadSummary = {
  id: string;
  fileName: string;
  imageUrl: string;
  activityDate: string;
};

async function getInitialData(): Promise<{
  users: UserSummary[];
  uploads: UploadSummary[];
}> {
  try {
    await connectToDatabase();

    const users = await User.find().sort({ createdAt: -1 }).lean();
    const userList = users.map((user) => ({
      id: String(user._id),
      name: user.name,
      email: user.email,
    }));

    const firstUserId = userList[0]?.id;
    if (!firstUserId) {
      return { users: [], uploads: [] };
    }

    const uploads = await ImageUpload.find({
      imageGroupId: firstUserId,
      isDeleted: false,
    })
      .sort({ activityDate: -1, createdAt: -1 })
      .lean();

    return {
      users: userList,
      uploads: uploads.map((upload) => ({
        id: String(upload._id),
        fileName: upload.fileName,
        imageUrl: upload.imageUrl,
        activityDate: upload.activityDate.toISOString(),
      })),
    };
  } catch {
    return { users: [], uploads: [] };
  }
}

export default async function Home() {
  const initialData = await getInitialData();

  return (
    <UserDetailsWorkflow
      initialUsers={initialData.users}
      initialUploads={initialData.uploads}
    />
  );
}
