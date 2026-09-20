'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Mod {
  id: string;
  title: string;
  description: string;
  image_url: string;
  slug: string;
  created_at?: string;
}

export default function AdminPage() {
  // --- GÜVENLİK VE GİRİŞ STATE'LERİ ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  const [mods, setMods] = useState<Mod[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 1. Yeni Mod Form State'leri
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // 2. Sürüm Ekleme Form State'leri
  const [selectedModId, setSelectedModId] = useState('');
  const [versionNumber, setVersionNumber] = useState('');
  const [changelog, setChangelog] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');

  // 3. Mod Düzenleme State'leri
  const [editingMod, setEditingMod] = useState<Mod | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');

  // Oturum durumunu kontrol et
  useEffect(() => {
    const auth = sessionStorage.getItem('admin_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Modları veritabanından çekme fonksiyonu
  const fetchMods = async () => {
    const { data, error } = await supabase
      .from('mods')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMods(data);
      
      setSelectedModId((prevId) => {
        const stillExists = data.some((m) => m.id === prevId);
        if (stillExists) return prevId;
        return data.length > 0 ? data[0].id : '';
      });
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchMods();
    }
  }, [isAuthenticated]);

  // GÜVENLİ GİRİŞ İŞLEMİ (Sunucu üzerinden doğrulama)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    try {
      const res = await fetch('/api/admin-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      });

      if (res.ok) {
        setIsAuthenticated(true);
        sessionStorage.setItem('admin_auth', 'true');
      } else {
        setAuthError('Hatalı şifre! Lütfen tekrar deneyin.');
      }
    } catch (err) {
      setAuthError('Giriş yapılırken bir hata oluştu.');
    }
  };

  // Çıkış Yapma İşlemi
  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth');
    setIsAuthenticated(false);
  };

  // Otomatik Slug Oluşturucu
  const createSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  // Yeni Mod Ekleme
  const handleCreateMod = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const slug = createSlug(title);

    const { error } = await supabase.from('mods').insert([
      { title, description, image_url: imageUrl, slug }
    ]);

    setLoading(false);
    if (error) {
      setMessage('Hata: ' + error.message);
    } else {
      setMessage('Mod başarıyla eklendi!');
      setTitle('');
      setDescription('');
      setImageUrl('');
      fetchMods();
    }
  };

  // Sürüm Ekleme
  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModId) {
      setMessage('Lütfen bir mod seçin!');
      return;
    }

    setLoading(true);
    setMessage('');

    const { error } = await supabase.from('mod_versions').insert([
      {
        mod_id: selectedModId,
        version_number: versionNumber,
        changelog,
        download_url: downloadUrl
      }
    ]);

    setLoading(false);
    if (error) {
      setMessage('Hata: ' + error.message);
    } else {
      setMessage('Sürüm başarıyla eklendi!');
      setVersionNumber('');
      setChangelog('');
      setDownloadUrl('');
    }
  };

  // Mod Silme
  const handleDeleteMod = async (id: string, modTitle: string) => {
    if (!confirm(`"${modTitle}" modunu silmek istediğinize emin misiniz?`)) return;

    setLoading(true);
    setMessage('');

    await supabase.from('mod_versions').delete().eq('mod_id', id);
    const { error } = await supabase.from('mods').delete().eq('id', id);

    setLoading(false);
    if (error) {
      setMessage('Silme hatası: ' + error.message);
    } else {
      setMessage('Mod ve bağlı tüm sürümleri silindi!');
      if (editingMod?.id === id) {
        setEditingMod(null);
      }
      fetchMods();
    }
  };

  // Düzenleme Başlat
  const handleStartEdit = (mod: Mod) => {
    setEditingMod(mod);
    setEditTitle(mod.title);
    setEditDescription(mod.description || '');
    setEditImageUrl(mod.image_url || '');
  };

  // Mod Güncelle
  const handleUpdateMod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMod) return;

    setLoading(true);
    setMessage('');

    const slug = createSlug(editTitle);

    const { error } = await supabase
      .from('mods')
      .update({
        title: editTitle,
        description: editDescription,
        image_url: editImageUrl,
        slug: slug
      })
      .eq('id', editingMod.id);

    setLoading(false);
    if (error) {
      setMessage('Güncelleme hatası: ' + error.message);
    } else {
      setMessage('Mod başarıyla güncellendi!');
      setEditingMod(null);
      fetchMods();
    }
  };

  // --- KİLİT EKRANI ---
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 max-w-md w-full space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-emerald-400">🔒 Admin Paneli Kilitli</h1>
            <p className="text-gray-400 text-sm">Devam etmek için yönetici şifrenizi girin.</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Yönetici Şifresi"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {authError && (
              <p className="text-red-400 text-sm text-center bg-red-900/30 p-2 rounded border border-red-800">
                {authError}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold py-2 rounded transition"
            >
              Giriş Yap
            </button>
          </form>
        </div>
      </main>
    );
  }

  // --- ADMİN PANELİ ---
  return (
    <main className="min-h-screen bg-gray-950 text-white p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="flex justify-between items-center border-b border-gray-800 pb-4">
          <h1 className="text-3xl font-extrabold text-emerald-400">
            Admin Yönetim Paneli
          </h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-800 rounded text-sm font-bold transition"
          >
            Çıkış Yap 🔒
          </button>
        </div>

        {message && (
          <div className="p-4 bg-emerald-900/50 border border-emerald-500 rounded text-emerald-200 text-sm">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 1. Yeni Mod Oluştur */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-emerald-400">Yeni Mod Oluştur</h2>
            <form onSubmit={handleCreateMod} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Mod Başlığı</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Örn: Void Tools Mod"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Açıklama</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mod hakkında detaylı bilgi..."
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Görsel URL (image_url)</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold py-2 rounded transition disabled:opacity-50"
              >
                {loading ? 'Kaydediliyor...' : 'Modu Kaydet'}
              </button>
            </form>
          </div>

          {/* 2. Sürüm / İndirme Linki Ekle */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-purple-400">Sürüm / İndirme Linki Ekle</h2>
            <form onSubmit={handleCreateVersion} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Hangi Mod İçin?</label>
                <select
                  value={selectedModId}
                  onChange={(e) => setSelectedModId(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                  {mods.map((mod) => (
                    <option key={mod.id} value={mod.id}>
                      {mod.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Sürüm Numarası</label>
                <input
                  type="text"
                  required
                  value={versionNumber}
                  onChange={(e) => setVersionNumber(e.target.value)}
                  placeholder="Örn: v1.0.0"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Değişiklik Notu (Changelog)</label>
                <textarea
                  rows={2}
                  value={changelog}
                  onChange={(e) => setChangelog(e.target.value)}
                  placeholder="Bu sürümde neler değişti?"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">İndirme Bağlantısı (URL)</label>
                <input
                  type="url"
                  required
                  value={downloadUrl}
                  onChange={(e) => setDownloadUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading || mods.length === 0}
                className="w-full bg-purple-600 hover:bg-purple-500 font-bold py-2 rounded transition disabled:opacity-50"
              >
                {loading ? 'Ekleniyor...' : 'Sürümü Kaydet'}
              </button>
            </form>
          </div>
        </div>

        {/* 3. Düzenleme Alanı */}
        {editingMod && (
          <div className="bg-gray-900 border-2 border-amber-500 rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-amber-400">
                Modu Düzenle: {editingMod.title}
              </h2>
              <button
                onClick={() => setEditingMod(null)}
                className="text-gray-400 hover:text-white font-bold"
              >
                İptal ✕
              </button>
            </div>
            <form onSubmit={handleUpdateMod} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Mod Başlığı</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Açıklama</label>
                <textarea
                  required
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Görsel URL (image_url)</label>
                <input
                  type="url"
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-amber-600 hover:bg-amber-500 font-bold py-2 rounded transition disabled:opacity-50"
                >
                  {loading ? 'Güncelleniyor...' : 'Güncellemeleri Kaydet'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingMod(null)}
                  className="px-4 bg-gray-800 hover:bg-gray-700 font-bold py-2 rounded transition"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 4. Eklenmiş Modlar Listesi */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-gray-200">Yayınlanmış Modlar ({mods.length})</h2>
          {mods.length === 0 ? (
            <p className="text-gray-500 text-sm">Henüz eklenmiş bir mod bulunmuyor.</p>
          ) : (
            <div className="space-y-3">
              {mods.map((mod) => (
                <div
                  key={mod.id}
                  className="bg-gray-800/60 p-4 rounded-lg border border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    {mod.image_url ? (
                      <img
                        src={mod.image_url}
                        alt={mod.title}
                        className="w-16 h-16 object-cover rounded border border-gray-700"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-700 rounded flex items-center justify-center text-xs text-gray-400">
                        Görsel Yok
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-lg text-white">{mod.title}</h3>
                      <p className="text-xs text-emerald-400">Slug: /mods/{mod.slug}</p>
                      <p className="text-sm text-gray-400 line-clamp-1">{mod.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStartEdit(mod)}
                      className="px-3 py-1.5 bg-amber-600/80 hover:bg-amber-500 rounded text-xs font-bold transition"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleDeleteMod(mod.id, mod.title)}
                      className="px-3 py-1.5 bg-red-600/80 hover:bg-red-500 rounded text-xs font-bold transition"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}