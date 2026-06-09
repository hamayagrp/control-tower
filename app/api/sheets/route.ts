import { google } from 'googleapis';
import { NextResponse } from 'next/server';

// 🤖 ロボットの認証を作る共通パーツ
const getAuth = () => {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  if (!clientEmail || !privateKey) {
    throw new Error('Vercelの環境変数が設定されていません。');
  }

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    // 🌟 '.readonly' を外して、書き込み可能な最強権限に変更しました！
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
};

// 📥 読み取り用プログラム（GET）
export async function GET() {
  try {
    const spreadsheetId = process.env.SPREADSHEET_ID;
    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges: ['シート1!A:Z', 'デモ❷!A:Z', 'デモ❸!A:Z'],
    });

    const valueRanges = response.data.valueRanges || [];
    return NextResponse.json({ 
      hasegawa: valueRanges[0]?.values || [],
      demo2: valueRanges[1]?.values || [],
      demo3: valueRanges[2]?.values || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 📤 書き込み用プログラム（POST） 新規追加！！
export async function POST(req: Request) {
  try {
    const { companyId, date, dandoriUrl } = await req.json();
    const spreadsheetId = process.env.SPREADSHEET_ID;
    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // 画面から来た会社IDを、スプレッドシートのタブ名に変換
    const sheetMap: Record<string, string> = {
      hasegawa: 'シート1',
      demo2: 'デモ❷',
      demo3: 'デモ❸'
    };
    const sheetName = sheetMap[companyId];

    // ① A列（日付）を全部読み取って、何行目かを探す
    const getRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:A`,
    });
    const rows = getRes.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === date);

    if (rowIndex === -1) {
      return NextResponse.json({ error: 'スプレッドシートに該当の日付が見つかりません。' }, { status: 404 });
    }

    // ② 見つけた行の「E列（ダンドリURL）」にURLを書き込む！
    // ※ rowIndexは0から始まるので、スプレッドシートの行番号に合わせるために +1 します
    const rowNumber = rowIndex + 1;
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!E${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[dandoriUrl]]
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("書き込みエラー:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}