import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config({ quiet: true });


// =====================================================
// CLOUDINARY CONFIG
// =====================================================

cloudinary.config({
    cloud_name: process.env.cloud_name,
    api_key: process.env.api_key,
    api_secret: process.env.api_secret
});


// =====================================================
// TEMP UPLOAD DIRECTORY
// =====================================================

const uploadDir = path.join(
    process.cwd(),
    "uploads",
    "temp"
);

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, {
        recursive: true
    });
}


// =====================================================
// MULTER STORAGE
// =====================================================

const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },

    filename: function (req, file, cb) {

        const uniqueSuffix =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1E9);

        const ext =
            path.extname(file.originalname);

        const userId =
            req.user?.userId || "anonymous";

        cb(
            null,
            `profile-${userId}-${uniqueSuffix}${ext}`
        );
    }
});


// =====================================================
// FILE FILTER
// =====================================================

const fileFilter = (req, file, cb) => {

    console.log(
        "File name:",
        file.originalname
    );

    console.log(
        "MIME type:",
        file.mimetype
    );

    const allowedExtensions = [
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".webp",
        ".avif"
    ];

    const extension =
        path
            .extname(file.originalname)
            .toLowerCase();


    /*
      We check extension instead of MIME type
      because Postman can sometimes send:

      application/octet-stream
    */

    if (
        allowedExtensions.includes(extension)
    ) {

        cb(null, true);

    } else {

        cb(
            new Error(
                "Only JPG, JPEG, PNG, GIF, WEBP and AVIF images are allowed"
            ),
            false
        );
    }
};


// =====================================================
// MULTER
// =====================================================

const upload = multer({

    storage,

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter
});


// =====================================================
// SHARP IMAGE COMPRESSION
// TARGET: AROUND 40-50 KB
// =====================================================

export const compressProfileImage = async (
    inputPath,
    outputPath
) => {

    let quality = 80;

    let width = 1000;

    let buffer;


    for (
        let attempt = 0;
        attempt < 12;
        attempt++
    ) {

        buffer = await sharp(inputPath)

            // Automatically fix image orientation
            .rotate()

            // Resize large images
            .resize({
                width: width,
                height: width,
                fit: "inside",
                withoutEnlargement: true
            })

            // Convert everything to JPEG
            .jpeg({
                quality: quality,
                mozjpeg: true
            })

            .toBuffer();


        const sizeKB =
            buffer.length / 1024;


        console.log(
            `Sharp attempt ${attempt + 1}: ${sizeKB.toFixed(2)} KB`
        );


        // Target achieved
        if (
            sizeKB >= 40 &&
            sizeKB <= 50
        ) {

            break;
        }


        // Already below 40 KB
        if (sizeKB < 40) {

            break;
        }


        // Still above 50 KB
        if (sizeKB > 50) {

            quality -= 7;


            // Don't make quality extremely low
            if (quality < 40) {

                quality = 70;

                width -= 100;

                if (width < 400) {
                    width = 400;
                }
            }
        }
    }


    await fs.promises.writeFile(
        outputPath,
        buffer
    );


    const finalSizeKB =
        buffer.length / 1024;


    console.log(
        `Final image size: ${finalSizeKB.toFixed(2)} KB`
    );


    return {
        path: outputPath,
        sizeKB: finalSizeKB
    };
};


// =====================================================
// CLOUDINARY UPLOAD
// =====================================================

export const updateProfileimg = async (
    filePath
) => {

    try {

        const result =
            await cloudinary.uploader.upload(
                filePath,
                {
                    folder: "profile_images",
                    resource_type: "image"
                }
            );


        console.log(
            "Cloudinary upload successful"
        );

        console.log(
            "URL:",
            result.secure_url
        );


        return result;

    } catch (error) {

        console.error(
            "Cloudinary upload error:",
            error.message
        );

        throw error;
    }
};


// =====================================================
// DELETE OLD CLOUDINARY IMAGE
// =====================================================

export const deleteProfileimg = async (
    publicId
) => {

    try {

        if (!publicId) {
            return null;
        }


        const result =
            await cloudinary.uploader.destroy(
                publicId,
                {
                    resource_type: "image"
                }
            );


        console.log(
            "Old profile image deleted:",
            publicId
        );


        return result;

    } catch (error) {

        console.error(
            "Delete old image error:",
            error.message
        );

        throw error;
    }
};


// =====================================================
// EXPORT MULTER
// =====================================================

export default upload;