import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const spreadsheetId = process.env.SPREADSHEET_ID;

    if (!clientEmail || !privateKey || !spreadsheetId) {
      return NextResponse.json(
        { error: 'Vercelの環境変数（Environment Variables）が設定されていません。' },
        { status: 500 }
      );
    }

    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // 🌟 ここが進化！3つのシートのデータを「一括」で取得します
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges: ['シート1!A:Z', 'デモ❷!A:Z', 'デモ❸!A:Z'], // 黒丸のタブ名に完全一致させます
    });

    const valueRanges = response.data.valueRanges || [];

    // 取得したデータを、それぞれの会社名に綺麗に分けてフロント（画面）へ送ります
    return NextResponse.json({ 
      hasegawa: valueRanges[0]?.values || [],
      demo2: valueRanges[1]?.values || [],
      demo3: valueRanges[2]?.values || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}