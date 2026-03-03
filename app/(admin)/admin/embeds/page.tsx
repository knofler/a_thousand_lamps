import EmbedForm from '@/components/admin/EmbedForm';

export default function AdminEmbedsPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl font-bold text-lamp-dark mb-2">Add Embed</h1>
      <p className="text-sm text-gray-400 mb-8">
        Paste a Facebook or Instagram post URL to add it to the feed.
      </p>
      <EmbedForm />
    </div>
  );
}
