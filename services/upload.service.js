import multer from "multer";
import { initCloudinary } from "../utils/cloudinary.js";

export const upload = multer({ storage: multer.memoryStorage() });

const cloudinary = initCloudinary();

const streamUpload = (buffer, folder, originalName) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",          
        folder,
        public_id: originalName,
        use_filename: true,
        unique_filename: false,
        overwrite: true
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

export const uploadFilesToCloudinary = async (
  files,
  filesMetaData = [],
  folder = "skayshare"
) => {
  const uploaded = [];

  for (let i = 0; i < files?.length; i++) {

    const res = await streamUpload(files[i].buffer, folder, files[i].originalname);

    uploaded.push({
      url: res.secure_url,
      public_id: res.public_id,
      fileName: filesMetaData[i]?.fileName || undefined,
      size: filesMetaData[i]?.size || undefined,
      files: filesMetaData[i]?.files || undefined,
      isFolder: filesMetaData[i]?.isFolder || undefined,
    });
  }
  return uploaded;
};

export const deleteFromCloudinary = async (publicId) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};
