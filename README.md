# dcard-backend-intern-homework

-   Dcard 每天午夜都有大量使用者湧入抽卡，為了不讓伺服器過載，請設計一個 middleware：
-   限制每小時來自同一個 IP 的請求數量不得超過 1000
-   在 response headers 中加入剩餘的請求數量 (X-RateLimit-Remaining) 以及 rate limit 歸零的時間 (X-RateLimit-Reset)
-   如果超過限制的話就回傳 429 (Too Many Requests)
-   可以使用各種資料庫達成

## TODO

    // 以目前的程式來說沒甚麼影響, 先做 sliding window

-   [ ] 處理 redis race condition 版本
-   [ ] 不處理 redis race condition 版本

### Rate limit 策略

-   [x] Fixed window
        以第一個請求往後一小時來劃分 window

-   [ ] Sliding window
        以最後一個請求往前推一小時來劃分 window

-   [ ] 有懲罰機制的 window ?
        ex : 請求到達上限後,在 rate limit reset 前再送請求就延長 10 分鐘

## 參考資料

### RateLimit Header Fields for HTTP

https://tools.ietf.org/id/draft-polli-ratelimit-headers-00.html
