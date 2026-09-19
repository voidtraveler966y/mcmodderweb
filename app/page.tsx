import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export const revalidate = 0; // Her yüklemede güncel veriyi çekmesi için

interface Mod {
  id: string;
  title: string;
  description: string;
  image_url: string;
  slug: string;
}

export default async function HomePage() {
  // Supabase'den tüm modları çekiyoruz
  const { data: mods, error } = await supabase
    .from('mods')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return <div className="p-8 text-center text-red-500">Modlar yüklenirken bir hata oluştu.</div>;
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold text-emerald-400">Void Traveler Mods</h1>
          <p className="text-gray-400">En güncel Minecraft modları ve indirme bağlantıları</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mods && mods.length > 0 ? (
            mods.map((mod: Mod) => (
              <div key={mod.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-emerald-500 transition">
                {mod.image_url ? (
                  <img src={mod.image_url} alt={mod.title} className="w-full h-48 object-cover" />
                ) : (
                  <div className="w-full h-48 bg-gray-800 flex items-center justify-center text-gray-500">
                    Görsel Yok
                  </div>
                )}
                <div className="p-5 space-y-3">
                  <h2 className="text-xl font-bold">{mod.title}</h2>
                  <p className="text-gray-400 text-sm line-clamp-2">{mod.description}</p>
                  <Link
                    href={`/mods/${mod.slug}`}
                    className="inline-block w-full text-center py-2 bg-emerald-600 hover:bg-emerald-500 rounded font-semibold transition"
                  >
                    Detaylar & İndir
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <p className="col-span-full text-center text-gray-500">Henüz eklenmiş bir mod bulunmuyor.</p>
          )}
        </div>
      </div>
    </main>
  );
}