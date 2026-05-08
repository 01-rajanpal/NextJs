"use client";

import { FormEvent, useMemo, useState } from "react";
import { FilePond } from "react-filepond";

type User = {
  id: string;
  name: string;
  email: string;
};

type Upload = {
  id: string;
  fileName: string;
  imageUrl: string;
  activityDate: string;
};

type Props = {
  initialUsers: User[];
  initialUploads: Upload[];
};

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

export default function UserDetailsWorkflow({
  initialUsers,
  initialUploads,
}: Props) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [uploads, setUploads] = useState<Upload[]>(initialUploads);
  const [selectedUserId, setSelectedUserId] = useState(initialUsers[0]?.id ?? "");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [files, setFiles] = useState<File[]>([]);
  const [activityDate, setActivityDate] = useState(todayValue());

  const [userMessage, setUserMessage] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId),
    [selectedUserId, users],
  );

  async function loadUploads(userId: string) {
    if (!userId) {
      setUploads([]);
      return;
    }

    const response = await fetch(`/api/uploads?userId=${userId}`);
    const payload = (await response.json()) as {
      uploads?: Upload[];
      message?: string;
    };

    if (!response.ok) {
      throw new Error(payload.message ?? "Failed to fetch uploads.");
    }

    setUploads(payload.uploads ?? []);
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUserMessage("");
    setIsCreatingUser(true);

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email }),
      });

      const payload = (await response.json()) as { user?: User; message?: string };

      if (!response.ok || !payload.user) {
        throw new Error(payload.message ?? "Failed to create user.");
      }

      setUsers((current) => [payload.user!, ...current]);
      setSelectedUserId(payload.user.id);
      setUploads([]);
      setName("");
      setEmail("");
      setUserMessage(`User created. Image group id: ${payload.user.id}`);
    } catch (error) {
      setUserMessage(error instanceof Error ? error.message : "Failed to create user.");
    } finally {
      setIsCreatingUser(false);
    }
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploadMessage("");

    if (!selectedUserId) {
      setUploadMessage("Select a user first.");
      return;
    }

    if (files.length === 0) {
      setUploadMessage("Select at least one photo.");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("userId", selectedUserId);
      formData.append("activityDate", activityDate);

      files.forEach((item) => {
        formData.append("files", item);
      });

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as {
        uploads?: Upload[];
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message ?? "Upload failed.");
      }

      setFiles([]);
      await loadUploads(selectedUserId);
      setUploadMessage(`${payload.uploads?.length ?? 0} photo(s) uploaded successfully.`);
    } catch (error) {
      setUploadMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleUserChange(userId: string) {
    setSelectedUserId(userId);
    setUploadMessage("");

    try {
      await loadUploads(userId);
    } catch (error) {
      setUploadMessage(
        error instanceof Error ? error.message : "Failed to fetch uploads.",
      );
    }
  }

  return (
    <main className="page">
      <section className="card">
        <h1>User details + daily photo uploads</h1>
        <p className="muted">
          Users are saved in a separate collection. Uploaded photos are stored in a
          shared global uploads collection using <code>imageGroupId</code> equal to
          the user id.
        </p>
      </section>

      <section className="card">
        <h2>Add user details</h2>
        <form className="form" onSubmit={handleCreateUser}>
          <label>
            Name
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Jane Doe"
            />
          </label>

          <label>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="jane@example.com"
            />
          </label>

          <button type="submit" disabled={isCreatingUser}>
            {isCreatingUser ? "Saving..." : "Save user"}
          </button>
        </form>
        {userMessage && <p className="status">{userMessage}</p>}
      </section>

      <section className="card">
        <h2>Daily photo upload activity</h2>
        <form className="form" onSubmit={handleUpload}>
          <label>
            Select user (imageGroupId)
            <select
              required
              value={selectedUserId}
              onChange={(event) => {
                void handleUserChange(event.target.value);
              }}
            >
              <option value="">Choose a user</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </label>

          {selectedUser && (
            <p className="muted">
              Active imageGroupId: <strong>{selectedUser.id}</strong>
            </p>
          )}

          <label>
            Activity date
            <input
              type="date"
              required
              value={activityDate}
              onChange={(event) => setActivityDate(event.target.value)}
            />
          </label>

          <div>
            <FilePond
              files={files}
              allowMultiple
              maxFiles={20}
              name="files"
              onupdatefiles={(items) =>
                setFiles(items.map((item) => item.file).filter((file) => file instanceof File))
              }
              labelIdle='Drag & Drop photos or <span class="filepond--label-action">Browse</span>'
            />
          </div>

          <button type="submit" disabled={isUploading}>
            {isUploading ? "Uploading..." : "Upload daily photos"}
          </button>
        </form>

        {uploadMessage && <p className="status">{uploadMessage}</p>}
      </section>

      <section className="card">
        <h2>Recent uploads for selected user</h2>
        {uploads.length === 0 ? (
          <p className="muted">No uploads yet.</p>
        ) : (
          <ul className="upload-list">
            {uploads.map((upload) => (
              <li key={upload.id}>
                <a href={upload.imageUrl} target="_blank" rel="noreferrer">
                  {upload.fileName}
                </a>
                <span>{new Date(upload.activityDate).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
