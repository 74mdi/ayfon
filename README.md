# ayfon

A small, dependency-free photo uploader designed for older iPhones and GitHub Pages. It sends each selected image to Telegram using `sendDocument`, so Telegram receives the original file bytes instead of a compressed photo rendition. Embedded EXIF and other file metadata remain in the uploaded file.

## Use

1. Create a Telegram bot with [@BotFather](https://t.me/BotFather).
2. Start a chat with the bot, or add it to the destination group/channel and grant permission to post.
3. Find the destination chat ID, then open ayfon and enter the bot token and chat ID.
4. Select multiple photos and send. Each file is sent individually; files over Telegram's current 50 MB Bot API limit are rejected.

Credentials are held only in page memory and are not stored. Since GitHub Pages is static hosting, the browser must call Telegram directly; anyone who operates this page can inspect the bot token in their browser's network tools. Use a bot dedicated to this purpose and revoke its token with BotFather if it is exposed.

## GitHub Pages

The site has no build step or dependencies. Publish the repository root with GitHub Pages (Settings → Pages → Deploy from a branch → `main` / `/ (root)`).

## Compatibility

Plain HTML, CSS and JavaScript avoid a build runtime and target Safari on iOS 12. Photos are sent as documents to avoid Telegram's photo resizing and compression. File size limit follows Telegram's Bot API and may change.
