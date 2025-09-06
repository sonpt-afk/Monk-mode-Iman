# Monk Mode Dashboard

Đây là project theo dõi tiến độ 6 tháng "Monk Mode" dành cho Web Developer.

## Cách Deploy lên Vercel

Sau khi code đã được sửa đổi để tương thích với Vercel, hãy làm theo các bước sau để có một URL công khai, nhanh và miễn phí.

### 1. Tạo Repository trên GitHub

- Truy cập [GitHub](https://github.com/new) và tạo một repository mới (đặt tên là `monk-mode-dashboard` chẳng hạn).
- **Không** khởi tạo với `README` hoặc `.gitignore` trên GitHub.
- Mở terminal trên máy của bạn, trong thư mục project này, và chạy các lệnh sau:
  ```bash
  git init -b main
  git add .
  git commit -m "Initial commit"
  git remote add origin <URL_REPO_CUA_BAN.git>
  git push -u origin main
  ```
  (Nhớ thay `<URL_REPO_CUA_BAN.git>` bằng URL repo bạn vừa tạo).

### 2. Deploy lên Vercel

1.  **Đăng ký/Đăng nhập Vercel:**
    - Truy cập [Vercel](https://vercel.com) và đăng ký một tài khoản mới bằng cách chọn "Continue with GitHub".

2.  **Tạo Project mới:**
    - Sau khi đăng nhập, bạn sẽ được chuyển đến dashboard. Click vào nút "**Add New...**" -> "**Project**".
    - Chọn repository `monk-mode-dashboard` bạn vừa đẩy lên GitHub.
    - Vercel sẽ tự động nhận diện đây là project Node.js.

3.  **Tạo và Kết nối Vercel KV Storage:**
    - Trong trang cấu hình project, hãy chuyển đến tab "**Storage**".
    - Click "**Connect Store**" bên cạnh "KV (beta)".
    - Chọn "**Create New**", đặt tên cho database (ví dụ: `monk-db`), chọn khu vực gần nhất và click "**Create**".
    - Click "**Connect**" để kết nối database vừa tạo vào project. Vercel sẽ tự động thêm biến môi trường `KV_URL` và `KV_REST_API_TOKEN` vào project.

4.  **Deploy:**
    - Quay lại trang deploy, click nút "**Deploy**".
    - Vercel sẽ bắt đầu build và deploy project của bạn. Quá trình này mất khoảng 1-2 phút.
    - Sau khi hoàn tất, Vercel sẽ cung cấp cho bạn một URL dạng `https://<ten-project>.vercel.app`.

Bây giờ bạn có thể truy cập URL này từ bất kỳ thiết bị nào để xem và cập nhật tiến độ của mình. Mọi thay đổi bạn push lên nhánh `main` của GitHub sẽ tự động được deploy.
