# AUREL · Dining & Wine

AUREL là website nhà hàng mẫu, từ xem thực đơn và không gian đến gửi yêu cầu đặt bàn. Nhân viên có trang quản trị riêng để xử lý yêu cầu, cập nhật giá và thêm món cùng ảnh. Ứng dụng dùng Next.js, React, TypeScript và Tailwind CSS, với backend serverless trên AWS.

[Web demo](https://main.d2rkhtb7c0k5r7.amplifyapp.com/) · [Hướng dẫn kỹ thuật](docs/guide.md) · [Bản phát hành](https://github.com/ndthuy21/aurel-restaurant/releases)

## Có thể làm gì?

| Khu vực | Tính năng |
| --- | --- |
| Thực đơn | 100 món Việt mẫu có ảnh. Tìm theo tên có dấu hoặc không dấu, lọc theo nhóm và món chay. |
| Không gian | Xem và phóng to ảnh không gian, món ăn và chi tiết trang trí. |
| Đặt bàn | Chọn ngày, giờ, số khách và nhận mã yêu cầu sau khi lưu. Nhà hàng xác nhận bàn riêng. |
| Quản trị | Quản lý thực đơn, bật hoặc ẩn món, xác nhận hoặc hủy yêu cầu đặt bàn và xem lời nhắn. |

Để đăng món mới, vào **Quản trị → Thực đơn → Thêm món**. Điền thông tin, chọn ảnh thu nhỏ trong thư viện hoặc tải ảnh **JPG, PNG, WebP tối đa 2 MB**. Xem trước, bật **Đang phục vụ** và bấm **Lưu món ăn**. Món đang phục vụ sẽ xuất hiện trên thực đơn công khai.

## Chạy trên máy

Cần **Node.js 22.13+** và **pnpm 11.25.0**. Chạy các lệnh sau trong thư mục repository:

```sh
pnpm install --frozen-lockfile
pnpm setup
pnpm dev
```

Mở [website local](http://127.0.0.1:3000/) hoặc [trang admin local](http://127.0.0.1:3000/admin). Dùng email `admin@aurel.local` và mật khẩu `LOCAL_ADMIN_PASSWORD` trong tệp `.env.local` do lệnh setup tạo. Chế độ local có sẵn món mẫu và lưu dữ liệu thử trong `.data/`.

## Kiến trúc AWS

- **Amplify Hosting** chạy giao diện Next.js và các route trung gian của trang admin.
- **API Gateway → Lambda → DynamoDB** xử lý yêu cầu. Khi khách đặt bàn, DynamoDB lưu yêu cầu và cập nhật sức chứa cùng một giao dịch.
- **Cognito** xác thực tài khoản quản trị. Ảnh tải lên nằm trong **S3 riêng tư** và được đọc qua URL ký có thời hạn.
- **SES** thử gửi email tiếp nhận sau khi yêu cầu đã lưu. Trong chế độ sandbox, việc gửi thư bị giới hạn theo danh tính đã xác minh.
- **CloudWatch** hỗ trợ theo dõi log và lỗi của hệ thống.

## Triển khai

1. Build Lambda bằng `pnpm build:lambda` và triển khai backend theo mẫu [AWS SAM](infra/template.yaml).
2. Lấy thông số từ CloudFormation, nạp thực đơn mẫu và tạo người dùng thuộc nhóm `admin` trong Cognito.
3. Kết nối repository với Amplify bằng [amplify.yml](amplify.yml), điền biến cấu hình và cập nhật `FrontendOrigin` để API Gateway và S3 nhận đúng origin.

[Hướng dẫn AWS đầy đủ](docs/guide.md#4-triển-khai-aws-backend) có lệnh từng bước, biến môi trường và quy trình dọn tài nguyên.

## Kiểm thử

```sh
pnpm check
pnpm build
pnpm test:smoke
```

`pnpm check` kiểm tra TypeScript, chạy bộ test và build gói Lambda. Smoke test chạy trên bản production cục bộ và thử các luồng như đăng nhập, lưu đặt bàn và tải ảnh món.

## Giấy phép và nguồn ảnh

Mã nguồn dùng giấy phép [MIT](LICENSE). Ảnh tư liệu có giấy phép riêng theo từng tệp. [Nguồn ảnh món ăn](PHOTO-CREDITS.md) · [Nguồn ảnh không gian](SPACE-PHOTO-CREDITS.md)
