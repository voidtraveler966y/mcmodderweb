import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();

    // Şifre sadece sunucuda durur, F12'de görünmez
    const REAL_PASSWORD = process.env.ADMIN_PASSWORD || 'void123';

    if (password === REAL_PASSWORD) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, message: 'Hatalı şifre' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Sunucu hatası' }, { status: 500 });
  }
}