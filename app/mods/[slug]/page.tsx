import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const revalidate = 0;

interface ModPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ModDetailPage({ params }: ModPageProps) {
  const { slug } = await params;

  // 1. Mod detayını çek
  const { data: mod, error: modError } = await supabase
    .from('mods')
    .select('*')
    .eq('slug', slug)
    .single();

  if (modError || !mod) {
    notFound();
  }

  // 2. Modun eklenmiş tüm sürümlerini çek
  const { data: versions } = await supabase
    .from('mod_versions')
    .select('*')
    .eq('mod_id', mod.id)
    .order('created_at', { ascending: false });

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          href="/"
          className="inline-flex items-center text-emerald-400 hover:text-emerald-300 font-medium transition"
        >
          ← Ana Sayfaya Dön
        </Link>

        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden p-6 space-y-6">
          {mod.image_url && (
            <img
              src={mod.image_url}
              alt={mod.title}
              className="w-full max-h-96 object-cover rounded-lg border border-gray-800"
            />
          )}

          <div>
            <h1 className="text-3xl font-extrabold text-emerald-400 mb-3">{mod.title}</h1>
            <p className="text-gray-300 leading-relaxed whitespace-pre-line">{mod.description}</p>
          </div>

          {/* Sürümler ve İndirme Bağlantıları */}
          <div className="border-t border-gray-800 pt-6">
            <h2 className="text-2xl font-bold mb-4 text-purple-400">İndirme Sürümleri</h2>

            {versions && versions.length > 0 ? (
              <div className="space-y-4">
                {versions.map((ver) => (
                  <div
                    key={ver.id}
                    className="bg-gray-800/60 p-4 rounded-lg border border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <span className="inline-block bg-purple-900/80 text-purple-200 text-xs px-2.5 py-1 rounded font-bold">
                        {ver.version_number}
                      </span>
                      <p className="text-sm text-gray-300">{ver.changelog || 'Değişiklik notu eklenmemiş.'}</p>
                    </div>

                    <a
                      href={ver.download_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-center font-bold text-sm transition"
                    >
                      İndir
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Bu mod için henüz bir indirme sürümü eklenmemiş.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}