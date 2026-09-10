export async function uploadToImgBB(fileOrBlob) {
  const API_KEY = "45c05625aae685ffcebb3c57906a6fb5";
  const EXPIRATION = 259200; // 3 days in seconds

  const formData = new FormData();
  formData.append("image", fileOrBlob);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}&expiration=${EXPIRATION}`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ImgBB upload failed: ${errorText}`);
  }

  const data = await response.json();
  return {
    url: data.data.url,
    deleteUrl: data.data.delete_url,
  };
}

export async function deleteFromImgBB(deleteUrl) {
  if (!deleteUrl) return false;
  
  try {
    // Note: ImgBB doesn't have an official API endpoint for deletion.
    // The deleteUrl is a webpage meant for users to click.
    // Making a GET request might not delete the image reliably.
    const response = await fetch(deleteUrl);
    return response.ok;
  } catch (error) {
    console.error("Failed to call ImgBB delete URL:", error);
    return false;
  }
}
