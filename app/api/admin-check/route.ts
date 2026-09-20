import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();

    // Şifre SADECE Netlify ortam değişkeninden okunur.
    // Kod içinde hiçbir varsayılan/yedek şifre kalmadı.
    const REAL_PASSWORD = process.env.ADMIN_PASSWORD;

    // Eğer Netlify'da ADMIN_PASSWORD tanımlanmadıysa veya okunamadıysa erişimi tamamen kapat
    if (!REAL_PASSWORD) {
      return NextResponse.json(
        { success: false, message: 'Sunucuda şifre ayarlanmamış.' },
        { status: 500 }
      );
    }

    if (password === REAL_PASSWORD) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, message: 'Hatalı şifre' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Sunucu hatası' }, { status: 500 });
  }
}