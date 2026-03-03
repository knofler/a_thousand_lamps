import ImageUploader from '@/components/admin/ImageUploader';

export default function AdminUploadPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl font-bold text-lamp-dark mb-2">Upload Photo</h1>
      <p className="text-sm text-gray-400 mb-8">
        Upload an image to Cloudinary and publish it to the feed.
      </p>
      <ImageUploader />
    </div>
  );
}
