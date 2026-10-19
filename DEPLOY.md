# 無料公開手順（Supabase + GitHub + Vercel）

> このプロジェクトは初期状態ではデモモードです。公開前にSupabaseを設定すると、複数のユーザーが同じ店舗とレビューを共有できます。各サービスの無料枠・利用規約は作業時点で確認してください。

## 1. Supabaseプロジェクトを作る
1. Supabaseでアカウントを作成し、新規プロジェクトを作成します。
2. SQL Editorを開き、`supabase/schema.sql` の内容を実行します。
3. AuthenticationのEmail設定を確認します。公開URLを設定した後、Site URL / Redirect URLsも設定します。
4. Project Settings → API から Project URL と anon/public key を取得します。`service_role` keyは使いません。

## 2. フロントエンドを接続
`app.js` 冒頭のCONFIGを編集します。管理者メールは `grgt1462@gmail.com` に設定済みです。サイト編集機能を有効にするには、必ずSupabaseでそのメールアドレスのアカウントを作成し、そのアカウントでログインしてください。

```js
const CONFIG = {
  supabaseUrl: "https://YOUR_PROJECT.supabase.co",
  supabaseAnonKey: "YOUR_SUPABASE_ANON_PUBLIC_KEY"
};
```

URLとanon/public keyは公開フロントエンドに置く前提の値ですが、必ずRLSを有効にしてポリシーを確認してください。service_role keyは絶対に貼り付けないでください。

## 3. サンプルデータについて
`app.js` の `demoStores` / `demoReviews` はレイアウト確認用の架空データです。Supabaseを設定した場合はDBから読み込みます。デプロイ前に実データのみが表示されることを確認してください。

## 4. GitHubへアップロード（ブラウザのみ）
1. GitHubで新しいリポジトリを作成。
2. `index.html`, `style.css`, `app.js`, `README.md`, `DEPLOY.md`, `PROJECT_SPEC.md`, `COPILOT_INSTRUCTIONS.md` と `supabase` フォルダをアップロード。
3. ファイルの階層が保たれていることを確認。

## 5. Vercelで公開
1. VercelへGitHubでログイン。
2. Add New Projectからリポジトリを選択。
3. Framework PresetはOther、Build Commandは空欄、Output Directoryは `.` を指定。
4. Deployを実行。HTML/CSS/JSの静的サイトなのでビルド処理は不要です。
5. 発行URLを開いて、登録・ログイン・店舗追加・レビュー投稿・平均集計をテストします。
6. 管理者メール `grgt1462@gmail.com` でログインし、編集モードと公開サイトへの保存を確認します。一般ユーザーでは編集ボタンが表示されません。
7. SQLを既存のSupabaseに後から適用する場合は、`supabase/schema.sql` 全体をSQL Editorで再実行し、エラーがないことを確認してください。

## 6. 公開前チェックリスト
- [ ] SupabaseのRLSが有効
- [ ] 未ログインユーザーが投稿できない
- [ ] `site_content` のRLSが有効で、管理者メール以外の更新が拒否される
- [ ] 管理者メールで保存したサイト文言が別ブラウザでも表示される
- [ ] ログイン済みユーザーが店舗/レビューを追加できる
- [ ] 他ユーザーのレビューも表示される
- [ ] 同一店舗にレビューが集約される
- [ ] Google Mapsリンクが正しい
- [ ] 店舗の重複登録を確認する
- [ ] 不適切投稿の通報/管理機能を用意する
- [ ] サンプルレビューを本番の評価として表示しない
- [ ] プライバシーポリシーと投稿ガイドラインを掲載

## 注意
この版は最初のプロトタイプです。管理者権限、レビュー編集/削除、店舗統合、メール確認のUX、レート制限、通報管理などは追加開発が必要です。
