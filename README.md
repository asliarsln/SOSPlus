# SOS Plus

A real-time multiplayer twist on the classic pencil-and-paper SOS game, built with Node.js, Express, and Socket.io.

🔗 **Play now:** [https://sosplus.onrender.com](https://sosplus.onrender.com)

## About

SOS Plus is a two-player online game where players take turns placing "S" or "O" letters on a grid, trying to form the sequence S-O-S. Unlike the classic version, SOS Plus adds unique twists that change how the game is played.

## Features

- **Real-time multiplayer**: Play against a friend using a simple room code system.
- **Customizable grid size**: Choose a board size between 3x3 and 7x7.
- **Challenge Level**: Start the game with 0 to 3 random neutral letters already placed on the board, adding an extra layer of strategy.
- **Swap power**: Each player gets one chance per game to flip an existing letter (S to O, or O to S).
- **Chain turns**: Forming an SOS lets you play again immediately — keep the streak going until you miss.
- **Rematch system**: Request a rematch after the game ends, with accept/decline options.
- **Disconnect handling**: Get notified if your opponent leaves mid-game.

## How to Play

1. Open the game and create a room, or join one using a 4-letter room code.
2. Share the room code with a friend so they can join.
3. Take turns placing "S" or "O" letters on the grid.
4. Form the sequence S-O-S (horizontally, vertically, or diagonally) to score a point and play again.
5. The game ends when the board is full — the player with the most points wins.

## Tech Stack

- **Backend**: Node.js, Express, Socket.io
- **Frontend**: HTML, CSS, vanilla JavaScript
- **Hosting**: Render

## Running Locally

```bash
cd backend
npm install
npm start
```

Then open `http://localhost:3000` in your browser.

## License

This project is open for personal and educational use.

---

# SOS Plus (Türkçe)

Klasik kağıt-kalem oyunu SOS'un gerçek zamanlı çok oyunculu versiyonu. Node.js, Express ve Socket.io ile geliştirildi.

🔗 **Hemen oyna:** [https://sosplus.onrender.com](https://sosplus.onrender.com)

## Hakkında

SOS Plus, iki oyuncunun sırayla tahtaya "S" veya "O" harfleri yerleştirerek S-O-S dizilimini oluşturmaya çalıştığı çevrimiçi bir oyundur. Klasik oyundan farklı olarak SOS Plus, oynanışı değiştiren özgün ekstra mekanikler içerir.

## Özellikler

- **Gerçek zamanlı çok oyunculu**: Basit bir oda kodu sistemiyle arkadaşınla oyna.
- **Özelleştirilebilir grid boyutu**: 3x3 ile 7x7 arasında tahta boyutu seç.
- **Zorluk Seviyesi (Challenge Level)**: Oyuna 0 ile 3 arası rastgele nötr harfle başla, stratejiye ekstra bir katman ekler.
- **Değiştirme hakkı**: Her oyuncunun oyun başına bir kez mevcut bir harfi çevirme hakkı var (S'den O'ya veya O'dan S'ye).
- **Zincirleme sıra**: SOS oluşturursan hemen tekrar oynarsın — SOS yapamadığın hamleye kadar sıra sende kalır.
- **Rövanş sistemi**: Oyun bittiğinde rövanş isteyebilir, kabul veya reddedebilirsin.
- **Bağlantı kesilme yönetimi**: Rakibin oyun ortasında ayrılırsa bilgilendirilirsin.

## Nasıl Oynanır

1. Oyunu aç, bir oda kur veya 4 harfli bir oda koduyla mevcut bir odaya katıl.
2. Oda kodunu arkadaşınla paylaş, katılmasını sağla.
3. Sırayla tahtaya "S" veya "O" harfleri yerleştirin.
4. S-O-S dizilimini (yatay, dikey veya çapraz) oluşturarak puan kazan ve tekrar oyna.
5. Tahta dolduğunda oyun biter — en çok puana sahip oyuncu kazanır.

## Teknoloji

- **Backend**: Node.js, Express, Socket.io
- **Frontend**: HTML, CSS, vanilla JavaScript
- **Hosting**: Render

## Yerelde Çalıştırma

```bash
cd backend
npm install
npm start
```

Ardından tarayıcında `http://localhost:3000` adresini aç.

## Lisans

Bu proje kişisel ve eğitim amaçlı kullanım için açıktır.
