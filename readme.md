## 📋 Softaware Yang Diperlukan

- **NVM** : Untuk node verison manager.
- **Mysql** : Untuk database.

## 🏁 Getting Started

### 1. Instalasi NVM

- Download & Install NVM : <br>https://github.com/coreybutler/nvm-windows/releases/download/1.2.2/nvm-setup.exe
- Cek Instalasi NVM via CMD as **Administrator** dengan command :

```bash
    nvm --version
```

- Install NodeJS via cmd as **Administrator** dengan command :

```bash
    nvm install lts
```

- Gunakan versi NodeJS via cmd as **Administrator** dengan command :

```bash
    npm use lts
```

- Cek instalasi NodeJS via cmd as **Administrator** dengan command :

```bash
    npm --version
```

### 2. Clone Repository

- Tentukan folder instalasi projek
- Buka cmd pada folder instalasi
- Clone repository dengan command :

```bash
    git clone https://github.com/ps08012002/Approval_Bot-Telegram.git
```

- Masuk kedalam folder projek dengan command :

```bash
    cd Approval_Bot-Telegram
```

- Install NodeJS dengan command :

```bash
    npm install
```

### 3. Create Database

- Download dan instal MYSQL : <br>https://dev.mysql.com/downloads/file/?id=541637
- Rename file didalam **/Backend/.env.example** menjadi **.env**

```bash
    Server Configuration For .env

    Username      = root (default)
    Password      = Your Password
    Server        = localhost (default)
    Port          = 3306 (default)
    Database_name = Your Database Name

    BOT_TOKEN        = Bot Token Here
    CHAT_ID          = Chat ID Here
```

### 3. Setup Nama Cabang

- Masuk ke **/Backend/prisma/seed.mjs**
- Rubah isi file sesuai dengan arahan

## 🚀 Starting Program

- Saat pertama kali start program jalankan dengan command :

```bash
    first.bat
```

- Untuk menjalankan program secara normal gunakan command :

```bash
    start.bat
```

### Built with ❤️ by Mr_UwaaW
