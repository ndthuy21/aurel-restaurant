# AUREL · Dining & Wine

Website nhà hàng mẫu xây dựng với Next.js, TypeScript và AWS.

[Web demo](https://main.d2rkhtb7c0k5r7.amplifyapp.com/) · [Hướng dẫn kỹ thuật](docs/guide.md) · [Tải mã nguồn](https://github.com/ndthuy21/aurel-restaurant/releases)

## Tính năng

- Thực đơn 100 món mẫu có ảnh, tìm kiếm và bộ lọc.
- Đặt bàn, nhận mã yêu cầu và gửi lời nhắn.
- Quản trị đặt bàn và thực đơn. Khi thêm hoặc sửa món, có thể chọn ảnh từ thư viện hoặc tải JPG, PNG, WebP tối đa 2 MB.

## Chạy trên máy

Cần Node.js 22.13+ và pnpm 11.25.0. Tại thư mục repository, chạy:

```sh
pnpm install --frozen-lockfile
pnpm setup
pnpm dev
```

Mở [website](http://127.0.0.1:3000/) hoặc [trang admin](http://127.0.0.1:3000/admin). Tài khoản local là `admin@aurel.local`. Lấy mật khẩu từ `.env.local` do `pnpm setup` tạo.

## Kiểm tra và triển khai

```sh
pnpm check
pnpm build
pnpm test:smoke
```

Amplify chạy giao diện. API Gateway và Lambda xử lý yêu cầu, DynamoDB lưu dữ liệu, Cognito xác thực admin và S3 lưu ảnh. Xem [hướng dẫn triển khai AWS](docs/guide.md#4-triển-khai-aws-backend) để cấu hình backend, Amplify và SES.

## Giấy phép

[Mã nguồn MIT](LICENSE) · [Nguồn ảnh món ăn](PHOTO-CREDITS.md) · [Nguồn ảnh không gian](SPACE-PHOTO-CREDITS.md)
