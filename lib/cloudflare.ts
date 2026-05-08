type CloudflareUploadResponse = {
  success: boolean;
  errors: Array<{ message: string }>;
  result?: {
    id: string;
    filename: string;
    variants?: string[];
  };
};

export async function uploadToCloudflare(file: File) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error(
      "Missing Cloudflare configuration (CLOUDFLARE_ACCOUNT_ID/CLOUDFLARE_API_TOKEN).",
    );
  }

  const formData = new FormData();
  formData.append("file", file, file.name);

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
      body: formData,
    },
  );

  const payload = (await response.json()) as CloudflareUploadResponse;

  if (!response.ok || !payload.success || !payload.result) {
    throw new Error(payload.errors?.[0]?.message ?? "Cloudflare upload failed.");
  }

  return {
    cloudflareImageId: payload.result.id,
    imageUrl: payload.result.variants?.[0] ?? "",
  };
}
