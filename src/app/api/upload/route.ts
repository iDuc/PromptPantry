import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { processImage, calculateSavings, formatBytes } from '@/lib/image-processor';

const BUCKET_NAME = 'result-images';
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB (increased since we compress)
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 20MB' },
        { status: 400 }
      );
    }

    // Use admin client for storage operations
    const adminClient = createAdminClient();

    // Convert File to Buffer for processing
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique folder for this upload
    const uploadId = crypto.randomUUID();
    const basePath = `${user.id}/${uploadId}`;

    let mainPath: string;
    let thumbPath: string;
    let compressionInfo: { originalSize: number; optimizedSize: number; savings: string } | undefined;

    try {
      // Process image: optimize and generate thumbnail
      const processed = await processImage(buffer);

      // Determine file extension based on format
      const mainExt = processed.main.format;
      mainPath = `${basePath}/main.${mainExt}`;
      thumbPath = `${basePath}/thumb.webp`;

      // Upload main image
      const { error: mainError } = await adminClient.storage
        .from(BUCKET_NAME)
        .upload(mainPath, processed.main.buffer, {
          contentType: mainExt === 'gif' ? 'image/gif' : 'image/webp',
          upsert: false,
        });

      if (mainError) {
        console.error('Main upload error:', mainError);
        throw new Error('Failed to upload main image');
      }

      // Upload thumbnail
      const { error: thumbError } = await adminClient.storage
        .from(BUCKET_NAME)
        .upload(thumbPath, processed.thumbnail.buffer, {
          contentType: 'image/webp',
          upsert: false,
        });

      if (thumbError) {
        console.error('Thumbnail upload error:', thumbError);
        // Clean up main image if thumbnail fails
        await adminClient.storage.from(BUCKET_NAME).remove([mainPath]);
        throw new Error('Failed to upload thumbnail');
      }

      compressionInfo = {
        originalSize: processed.originalSize,
        optimizedSize: processed.optimizedSize,
        savings: calculateSavings(processed.originalSize, processed.optimizedSize),
      };

      console.log(
        `Image optimized: ${formatBytes(processed.originalSize)} → ${formatBytes(processed.optimizedSize)} (${compressionInfo.savings} saved)`
      );
    } catch (processingError) {
      // Fallback: upload original file if processing fails
      console.error('Image processing failed, uploading original:', processingError);

      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      mainPath = `${basePath}/main.${fileExt}`;
      thumbPath = ''; // No thumbnail in fallback mode

      const { error: uploadError } = await adminClient.storage
        .from(BUCKET_NAME)
        .upload(mainPath, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('Fallback upload error:', uploadError);
        return NextResponse.json(
          { error: 'Failed to upload image' },
          { status: 500 }
        );
      }
    }

    // Get public URLs
    const { data: mainUrlData } = adminClient.storage
      .from(BUCKET_NAME)
      .getPublicUrl(mainPath);

    const thumbnailUrl = thumbPath
      ? adminClient.storage.from(BUCKET_NAME).getPublicUrl(thumbPath).data.publicUrl
      : null;

    return NextResponse.json({
      url: mainUrlData.publicUrl,
      thumbnailUrl,
      fileName: mainPath,
      compression: compressionInfo,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove images
export async function DELETE(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { error: 'No URL provided' },
        { status: 400 }
      );
    }

    // Use admin client for storage operations
    const adminClient = createAdminClient();

    // Extract file path from URL (includes user folder)
    const urlParts = url.split(`${BUCKET_NAME}/`);
    const filePath = urlParts[urlParts.length - 1];

    // Verify the file belongs to the user (path starts with user_id)
    if (!filePath.startsWith(user.id)) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this file' },
        { status: 403 }
      );
    }

    // Extract the folder path (userId/uploadId) from the file path
    // Files are stored as: userId/uploadId/main.webp or userId/uploadId/thumb.webp
    const pathParts = filePath.split('/');
    if (pathParts.length >= 3) {
      // New folder structure: delete both main and thumbnail
      const folderPath = `${pathParts[0]}/${pathParts[1]}`;

      // List and delete all files in the folder
      const { data: files } = await adminClient.storage
        .from(BUCKET_NAME)
        .list(folderPath);

      if (files && files.length > 0) {
        const filesToDelete = files.map(f => `${folderPath}/${f.name}`);
        const { error } = await adminClient.storage
          .from(BUCKET_NAME)
          .remove(filesToDelete);

        if (error) {
          console.error('Delete error:', error);
          return NextResponse.json(
            { error: 'Failed to delete image' },
            { status: 500 }
          );
        }
      }
    } else {
      // Legacy single file structure: delete the file directly
      const { error } = await adminClient.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        console.error('Delete error:', error);
        return NextResponse.json(
          { error: 'Failed to delete image' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to process delete' },
      { status: 500 }
    );
  }
}
