# Proje Ortam Değişkenleri ve Yapılandırma Notları

Bu dosyada, Cafe&Restorant Sipariş Sistemi uygulamasının kullandığı ortam değişkenleri ve diğer önemli yapılandırma notları listelenmiştir.

## `ADMIN_PASSWORD`

- **Açıklama:** Yönetici (Admin) rolü için kullanılacak şifreyi belirler. Bu şifre, yalnızca **Yönetici Panelinden şifre koruması aktif edildiğinde** geçerlidir ve kullanılır.
- **Örnek Değer:** `gizliAdminSifresi123`
- **Not:** Eğer şifre koruması aktif ise ve bu ortam değişkeni ayarlanmamışsa veya boş bırakılmışsa, geliştirme için tanımlanmış varsayılan bir admin şifresi (`DEV_ADMIN_PASSWORD` = "admin" olarak `constants.tsx` içinde tanımlıdır) kullanılır. Üretim ortamlarında, şifre koruması aktif kullanılıyorsa bu değişkenin mutlaka güvenli bir değerle ayarlanması şiddetle önerilir. Şifre koruması Yönetici Panelinden kapalıysa bu değişkenin bir etkisi yoktur.

## `API_KEY` (Google Gemini API Anahtarı)

- **Açıklama:** Google Gemini API (Google GenAI SDK) için kullanılacak API anahtarı. Bu anahtar, ürün açıklaması oluşturma gibi yapay zeka özelliklerinin çalışması için gereklidir.
- **Örnek Değer:** `AIzaSy*******************`
- **Not:** Bu anahtarın Google Cloud Console üzerinden oluşturulması ve güvenli bir şekilde saklanması gerekir. Bu anahtar, Yönetici Panelindeki "Ayarlar" bölümünden de yönetilebilir. Ortam değişkeni ayarlanırsa, başlangıçta bu değer okunabilir; ancak panelden yapılan değişiklikler `localStorage`'da saklanır ve öncelikli olur.

## Şifre Koruması

- **Yönetim:** Uygulama genelinde şifre korumasının aktif olup olmayacağı **Yönetici Paneli > Ayarlar** bölümünden yönetilir.
- **Varsayılan Durum:** Uygulama ilk kez çalıştırıldığında veya ayar `localStorage`'da bulunmadığında, şifre koruması **varsayılan olarak AKTİF (`true`)** kabul edilir.
- **Etkisi:**
    - **Aktif:** Kullanıcıların giriş yapmak için şifre girmesi gerekir.
    - **Kapalı:** Kullanıcılar rol seçerek şifresiz giriş yapabilir.

---

**Örnek `.env` Dosyası İçeriği (Gerektiğinde):**

```dotenv
# Admin şifresi (YALNIZCA Yönetici Panelinden şifre koruması aktif ise kullanılır)
ADMIN_PASSWORD=superGucluBirSifre

# Google Gemini API Anahtarı (AI özellikleri için - Panelden de ayarlanabilir)
# API_KEY=AIzaSyYOUR_UNIQUE_API_KEY_HERE 
# (Eğer panelden yönetilecekse bu satır yorumlu kalabilir veya silinebilir.)
```