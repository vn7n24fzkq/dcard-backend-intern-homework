# dcard-backend-intern-homework

-   Dcard 每天午夜都有大量使用者湧入抽卡，為了不讓伺服器過載，請設計一個 middleware：
-   限制每小時來自同一個 IP 的請求數量不得超過 1000
-   在 response headers 中加入剩餘的請求數量 (X-RateLimit-Remaining) 以及 rate limit 歸零的時間 (X-RateLimit-Reset)
-   如果超過限制的話就回傳 429 (Too Many Requests)
-   可以使用各種資料庫達成

### How to start server

`npm install`
`npm build`

-   Run with fixed window
    `npm run start:fixed-window`

-   Run with sliding window
    `npm run start:sliding-window`

### Rate limit 策略

-   [x] Fixed window
        以第一個請求往後一小時來劃分 window

-   [x] Sliding window
        以最後一個請求往前推一小時來劃分 window

### Note

-   額外在 header 加上 X-RateLimit-Limit 來回傳 time window 中有多少請求額度, 以及 window 類型

    -   EX : `100;window=60;comment="fixed window"` 代表每個 window 60 秒,並且每個 window 裡面允許 100 個請求

-   sliding-window 不包含 `X-RateLimit-Reset` 因為會需要額外做計算

-   Race Condition 問題
    -   目前 fixed window 不太受 Race Conditioin 影響
    -   Do everything in Lua script
        -   應考慮 script 的 atomic 特性會不會影響到整體運作效率

## 參考資料

### RateLimit Header Fields for HTTP

https://tools.ietf.org/id/draft-polli-ratelimit-headers-00.html
