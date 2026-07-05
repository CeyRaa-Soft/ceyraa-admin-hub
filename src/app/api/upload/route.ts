import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const designCode = searchParams.get("designCode") || "item";
    const color = searchParams.get("color") || "color";
    const folderParam = searchParams.get("folder") || "ceyraa";
    const orderId = searchParams.get("orderId") || "order";

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let folder = "ceyraa";
    let publicId = "";
    let transformation: any[] = [];

    if (folderParam === "stages") {
      folder = "ceyraa_stages";
      const cleanOrderId = orderId.replace(/[^a-zA-Z0-9_-]/g, "");
      publicId = `stage_${cleanOrderId}_${Date.now()}`;
      transformation = [
        {
          width: 2000,
          height: 2000,
          crop: "limit", // Preserve aspect ratio, only shrink if exceeds 2000px
          quality: "auto",
        },
      ];
    } else {
      // Default Garment Inventory upload
      folder = "ceyraa";
      const cleanCode = designCode.replace(/[^a-zA-Z0-9_-]/g, "").toUpperCase();
      const cleanColor = color.replace(/[^a-zA-Z0-9_-]/g, "");
      publicId = `design_${cleanCode}_${cleanColor}_${Date.now()}`;
      transformation = [
        {
          width: 1200,
          height: 1500,
          crop: "fill",
          gravity: "auto",
          quality: "auto",
        },
      ];
    }

    // Upload image to Cloudinary using stream with auto transformations
    const uploadResult: any = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: publicId,
          resource_type: "image",
          format: "webp", // Force WebP storage
          transformation: transformation,
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload stream error:", error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(buffer);
    });

    return NextResponse.json({
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    });
  } catch (error: any) {
    console.error("Upload handler error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload image to Cloudinary" },
      { status: 500 }
    );
  }
}
