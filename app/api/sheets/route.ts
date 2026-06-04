import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    // Windows環境やVercelでの改行コードのズレを自動修正します
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const spreadsheetId = process.env.SPREADSHEET_ID;

    if (!clientEmail || !privateKey || !spreadsheetId) {
      return NextResponse.json(
        { error: 'Vercelの環境変数（Environment Variables）が設定されていません。' },
        { status: 500 }
      );
    }

    // Googleの認証をセットアップ
    const auth = new google.auth.JWT(
      clientEmail,
      undefined,
      privateKey,
      ['https://www.googleapis.com/auth/spreadsheets.readonly']
    );

    const sheets = google.sheets({ version: 'v4', auth });

    // スプレッドシートからデータを取得（「シート1」のA列からZ列まで丸ごと読み込みます）
    // ※もし実際のシート名が「シート1」ではない場合は、下の 'シート1!A:Z' を実際のシート名（例: 'Sheet1!A:Z'）に書き換えてください。
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'シート1!A:Z', 
    });

    return NextResponse.json({ data: response.data.values });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}