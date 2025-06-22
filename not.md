# Proje Ortam Değişkenleri ve Yapılandırma Notları (Docker & PostgreSQL)

Bu dosyada, Cafe&Restoran Sipariş Sistemi uygulamasının Docker ve PostgreSQL ile çalışırken kullandığı ortam değişkenleri ve diğer önemli yapılandırma notları listelenmiştir.

## Ortam Değişkenleri için `.env` Dosyası

Projenizin kök dizininde bir `.env` dosyası oluşturarak aşağıdaki değişkenleri tanımlayabilirsiniz. `docker-compose.yml` dosyası bu değerleri kullanacaktır.

```dotenv
# Frontend Ayarları
FRONTEND_PORT=8080
BACKEND_API_URL=http://localhost:3001/api # Backend API'nizin tam adresi (Docker dışındaysa localhost, içindeyse servis adı)

# Google Gemini API Anahtarı
GEMINI_API_KEY=AIzaSy_YOUR_ACTUAL_GEMINI_API_KEY_HERE

# PostgreSQL Bağlantı Bilgileri (Backend'iniz bu değişkenleri kullanır)
DB_HOST=postgres # Genellikle docker-compose içindeki servis adı
DB_PORT=5432
DB_USER=cafeuser
DB_PASSWORD=cafepassword
DB_NAME=cafedb
# Veya tam bağlantı string'i (Backend'inizin desteklediği formata göre):
# DATABASE_URL=postgresql://cafeuser:cafepassword@postgres:5432/cafedb

# Admin Şifresi (Backend'iniz bu değişkeni kullanır)
ADMIN_PASSWORD=superGucluBirSifre123!
```

## Detaylı Değişken Açıklamaları

### Frontend (`frontend` servisi - `docker-compose.yml`)

1.  **`FRONTEND_PORT`** (Opsiyonel, `.env` dosyasından okunur)
    *   **Açıklama:** Frontend uygulamasının host makinede hangi portta yayınlanacağını belirler.
    *   **Varsayılan Değer:** `8080` (Eğer `.env` dosyasında tanımlanmazsa)
    *   **Docker Compose Kullanımı:** `ports: - "${FRONTEND_PORT:-8080}:80"`

2.  **`BACKEND_API_URL`** (`.env` dosyasından okunur, `config.js`'e yazılır)
    *   **Açıklama:** Frontend uygulamasının veri işlemleri için iletişim kuracağı backend API'sinin tam URL'si.
    *   **Nasıl Ayarlanır:** `.env` dosyasında tanımlanır. Bu değer, `docker-compose.yml` aracılığıyla `frontend` servisine ortam değişkeni olarak aktarılır. `entrypoint.sh` scripti bu değeri `/usr/share/nginx/html/config.js` dosyasına çalışma zamanında yazar. Frontend bu `config.js` dosyasını okur.
    *   **Örnek Değer (`.env` içinde):** `http://localhost:3001/api` (Eğer backend Docker dışında çalışıyorsa) veya `http://backend-service-name:3000/api` (Eğer backend `backend-service-name` adıyla Docker Compose içinde tanımlıysa).

3.  **`GEMINI_API_KEY`** (`.env` dosyasından okunur, build sırasında kullanılır)
    *   **Açıklama:** Google Gemini API (Google GenAI SDK) için kullanılacak API anahtarı. Ürün açıklaması oluşturma gibi yapay zeka özellikleri için gereklidir.
    *   **Nasıl Ayarlanır:** `.env` dosyasında tanımlanır. Bu değer, `docker-compose.yml` aracılığıyla `Dockerfile`'daki build sürecine `build args` olarak aktarılır. `esbuild` komutu, bu anahtarı `process.env.API_KEY` olarak frontend JavaScript paketine derleme zamanında gömer.
    *   **Frontend Kullanımı:** `apiService.ts` içindeki `new GoogleGenAI({ apiKey: process.env.API_KEY })` satırı, build sırasında gömülen bu değeri kullanır.
    *   **Önemli:** Bu anahtarın Google AI Studio veya Google Cloud Console üzerinden oluşturulması ve güvenli bir şekilde saklanması gerekir. Frontend'in Yönetici Panelindeki API anahtarı ayar bölümü, anahtarın ortam değişkenlerinden yönetilmesi nedeniyle kaldırılmıştır.

### PostgreSQL (`postgres` servisi - `docker-compose.yml`)

Aşağıdaki değişkenler `.env` dosyasından okunur ve PostgreSQL konteynerini başlatmak için kullanılır. Backend API'niz de bu bilgilere (veya eşdeğerlerine, örneğin `DATABASE_URL` gibi bir bağlantı dizesine) ihtiyaç duyacaktır.

1.  **`DB_HOST`**
    *   **Backend için Değer:** `postgres` (`docker-compose.yml` içindeki servis adı).
2.  **`DB_PORT`**
    *   **Değer:** `5432` (Varsayılan PostgreSQL portu). `.env` ile değiştirilebilir.
3.  **`DB_USER`**
    *   **Değer:** `cafeuser` (Varsayılan, `.env` ile değiştirilebilir).
4.  **`DB_PASSWORD`**
    *   **Değer:** `cafepassword` (Varsayılan, `.env` ile değiştirilebilir). **Üretimde mutlaka güçlü bir şifre kullanın!**
5.  **`DB_NAME`**
    *   **Değer:** `cafedb` (Varsayılan, `.env` ile değiştirilebilir).

### Backend (Bu `docker-compose.yml`'de tanımlı değil, sizin tarafınızdan geliştirilecek)

Backend API'nizin aşağıdaki ortam değişkenlerini (veya benzerlerini) desteklemesi beklenir:

1.  **`ADMIN_PASSWORD`** (`.env` dosyasından okunur)
    *   **Açıklama:** Yönetici (Admin) rolü için kullanılacak şifreyi belirler. Backend API'niz bu şifreyi yönetici girişi doğrulaması için kullanır.
    *   **Not:** Üretim ortamlarında bu değişkenin mutlaka güvenli bir değerle ayarlanması şiddetle önerilir.

2.  **PostgreSQL Bağlantı Bilgileri**
    *   Backend'iniz, yukarıda PostgreSQL için listelenen `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` değişkenlerini veya `DATABASE_URL` gibi bir bağlantı dizesini kullanarak veritabanına bağlanmalıdır.

3.  **`GEMINI_API_KEY`** (Opsiyonel, eğer backend de AI özelliklerini kullanıyorsa)
    *   Backendiniz de Gemini API'yi kullanıyorsa, `.env` dosyasındaki `GEMINI_API_KEY` değişkenini okuyacak şekilde yapılandırılmalıdır.

## Şifre Koruması (Uygulama Geneli)

-   **Yönetim:** Uygulama genelinde şifre korumasının aktif olup olmayacağı **Yönetici Paneli > Ayarlar** bölümünden yönetilir. Bu ayar `localStorage`'da saklanır ve frontend bu ayara göre davranır.
-   **Etkisi:**
    -   **Aktif:** Kullanıcıların ve Yöneticinin giriş yapmak için şifre girmesi gerekir. Frontend, şifreyi backend'e gönderir; backend doğrulama yapar.
    -   **Kapalı:**
        -   **Roller (Kasiyer, Garson vb.):** Frontend, kullanıcı ID'si ile birlikte özel bir belirteç (`__SIFRE_AC_DISABLED_VIA_ADMIN_PANEL__`) backend'e gönderir. Backend bu özel duruma göre şifresiz girişe izin vermelidir.
        -   **Admin:** Frontend, admin rolü ve aynı özel belirteç ile backend'e istek gönderir.
-   **Not:** Backend API'si, frontend'den gelen bu "şifre koruması kapalı" bilgisini (örneğin, özel belirteç ile) dikkate alarak kimlik doğrulama mantığını uygun şekilde işlemelidir.

---

Bu yapılandırma, uygulamanızın Docker ve PostgreSQL ile daha ölçeklenebilir ve yönetilebilir bir şekilde çalışmasını sağlar. Backend API'sinin geliştirilmesi ve bu ortam değişkenlerini doğru şekilde kullanması sizin sorumluluğunuzdadır. Frontend artık veritabanı ayarlarını veya Gemini API anahtarını doğrudan yönetmemektedir; bu ayarlar Docker ortamı ve backend üzerinden yapılandırılır.
