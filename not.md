# Proje Ortam Değişkenleri (Environment Variables)

Bu dosyada, TinyMinyKids Yönetim Sistemi uygulamasının kullandığı ortam değişkenleri listelenmiştir.
Bu değişkenler, uygulamanın çalıştığı ortamda (örneğin `.env` dosyası veya hosting platformu ayarları) tanımlanmalıdır.

## `SIFRE_AC`

- **Açıklama:** Uygulama genelinde şifre korumasının aktif olup olmayacağını belirler.
- **Değerler:**
    - `1`: Şifre koruması aktif. Kullanıcıların giriş yapmak için şifre girmesi gerekir.
    - `0` (veya tanımlı değilse): Şifre koruması kapalı. Kullanıcılar rol seçerek şifresiz giriş yapabilir.
- **Varsayılan:** `0` (Kapalı) - Eğer değişken tanımlanmamışsa veya değeri `1` dışında bir şeyse, şifre koruması kapalı kabul edilir.

## `ADMIN_PASSWORD`

- **Açıklama:** Yönetici (Admin) rolü için kullanılacak şifreyi belirler. Bu şifre, yalnızca `SIFRE_AC=1` (şifre koruması aktif) olduğunda geçerlidir ve kullanılır.
- **Örnek Değer:** `gizliAdminSifresi123`
- **Not:** Eğer `SIFRE_AC=1` ise ve bu değişken ayarlanmamışsa veya boş bırakılmışsa, geliştirme için tanımlanmış varsayılan bir admin şifresi (`DEV_ADMIN_PASSWORD` = "admin" olarak `constants.tsx` içinde tanımlıdır) kullanılır. Üretim ortamlarında, `SIFRE_AC=1` kullanılıyorsa bu değişkenin mutlaka güvenli bir değerle ayarlanması şiddetle önerilir. `SIFRE_AC=0` ise bu değişkenin bir etkisi yoktur.

## `API_KEY`

- **Açıklama:** Google Gemini API (Google GenAI SDK) için kullanılacak API anahtarı. Bu anahtar, ürün açıklaması oluşturma gibi yapay zeka özelliklerinin çalışması için gereklidir.
- **Örnek Değer:** `AIzaSy*******************`
- **Not:** Bu anahtarın Google Cloud Console üzerinden oluşturulması ve güvenli bir şekilde saklanması gerekir. Eğer bu değişken ayarlanmazsa, AI ile ilgili özellikler çalışmayacaktır.

---

**Örnek `.env` Dosyası İçeriği:**

```dotenv
# Şifre korumasını aktif etmek için 1, kapatmak için 0 yapın.
# Yorumlanırsa veya silinirse, varsayılan olarak şifre koruması KAPALI (0) olur.
SIFRE_AC=0

# Admin şifresi (YALNIZCA SIFRE_AC=1 ise kullanılır)
ADMIN_PASSWORD=superGucluBirSifre

# Google Gemini API Anahtarı (AI özellikleri için)
API_KEY=AIzaSyYOUR_UNIQUE_API_KEY_HERE
```