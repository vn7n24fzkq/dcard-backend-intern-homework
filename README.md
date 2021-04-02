# dcard-backend-intern-homework

-   Dcard 每天午夜都有大量使用者湧入抽卡，為了不讓伺服器過載，請設計一個 middleware：
-   限制每小時來自同一個 IP 的請求數量不得超過 1000
-   在 response headers 中加入剩餘的請求數量 (X-RateLimit-Remaining) 以及 rate limit 歸零的時間 (X-RateLimit-Reset)
-   如果超過限制的話就回傳 429 (Too Many Requests)
-   可以使用各種資料庫達成

### How to start

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

-   我額外在 header 加上 X-RateLimit-Limit 來回傳 time window 中有多少請求額度, 以及 window 類型
    -   EX : `100;window=60;comment="fixed window"` 代表每個 window 60 秒,並且每個 window 裡面允許 100 個請求

-   sliding-window 不包含 `X-RateLimit-Reset` 因為會需要額外做計算

-   Race Condition 問題
    -   目前 fixed window 不太受 Race Conditioin 影響
    -   目前 sliding window 受 Race Conditioin 影響, 但整體來說仍可達到 rate limit 的效果，如要準確計算，應改善計算 remaining 的[地方](https://github.com/vn7n24fzkq/dcard-backend-intern-homework/blob/abee0cf0a7177047f9f70bc6a1a9980ab1d08d0f/src/middleware/rateLimit.ts#L37)
    -   Do everything in Lua script
        -   應考慮 script 的 atomic 特性會不會影響到整體運作效率
## 測試
##### 環境
VirtualBox
OS: Ubuntu 20.02
Memory: 8192 MB
Processor: 8
Node12

使用 [autocannon](https://github.com/mcollina/autocannon) 測試 : 參數 connections 20 pipelining 4 duration 30 其餘都使用預設 

先用 ``` npm run ```啟動 任一 server
然後再 ``` npm run benchamark ```
這邊簡單測試一下單純兩種策略的差別，以及在此 middleware 之上再加入其他處理(例如:logger)的影響
可以看到 logger 的加入會明顯影響請求時間 (這邊可以透過不 log 被 limiter 擋下的請求來改善)

##### fixed-window
- fixed-window without logger
<img src="https://user-images.githubusercontent.com/20241522/112953001-ac1e5b00-916f-11eb-903c-b5d636c11b54.png" height="240" width="500">

- fixed-window with logger
<img src="https://user-images.githubusercontent.com/20241522/112953332-fb648b80-916f-11eb-9340-01f333c44ec5.png" height="240" width="500"> 

##### sliding-window
- sliding-window without logger
<img src="https://user-images.githubusercontent.com/20241522/112952863-8b560580-916f-11eb-99ba-6fbd81ef910e.png" height="240" width="500">

- sliding-window with logger
<img src="https://user-images.githubusercontent.com/20241522/112953116-c6f0cf80-916f-11eb-9400-6ef666d01fa9.png" height="240" width="500"> 

可以看到以相同時間內同一 IP 可以處理的請求數量來說 sliding-window 上的效果是跟 fixed-window 差不多的的(應該需要更深入的測試), 但實務上來說 sliding-window 可以避免瞬間流量過大

加入 logger 後可以看到對於可以處理的請求數量來說有明顯下降的趨勢(如果非必要，在設計上應考慮減少對於每個請求的前處理會做的事情)

下圖為將 logger 放在 rateLimit middleware 後的結果(只 log 被接受的請求)，可以發現改善了不少

<img src="https://user-images.githubusercontent.com/20241522/112955064-9f9b0200-9171-11eb-89c5-f62ed90d146c.png" height="240" width="500">

#### 將 aucton 參數改成 connections 20 pipelining 1 duration 30 works 8
這邊把每個 connnection 都當成獨立的 client 來模擬不同客戶端同時請求的狀況(總共 20*8=160 個 client)

- fixed-window
<img src="https://user-images.githubusercontent.com/20241522/112971292-a6ca0c00-9181-11eb-9470-0d2ca1901a25.png" height="240" width="500">

- sliding-window
<img src="https://user-images.githubusercontent.com/20241522/112970831-34592c00-9181-11eb-93b7-1e864a2952b8.png" height="240" width="500">

## 參考資料

### RateLimit Header Fields for HTTP

https://tools.ietf.org/id/draft-polli-ratelimit-headers-00.html
